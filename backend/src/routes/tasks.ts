import { Router, Response } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auditLog } from '../utils/auditLog';

const router = Router();
const prisma = new PrismaClient();

// Get all tasks
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = '1', limit = '50', status, type, userId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    
    // Users can only see their own tasks unless they're admin/operator
    if (req.user!.role === 'VIEWER') {
      where.userId = req.user!.id;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Users can only see their own tasks unless they're admin/operator
    if (req.user!.role === 'VIEWER' && task.userId !== req.user!.id) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { type, metadata } = req.body;

    if (!type) {
      throw new AppError('Task type is required', 400, 'VALIDATION_ERROR');
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user!.id,
        type,
        status: TaskStatus.PENDING,
        metadata: metadata || {}
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Create progress record
    await prisma.progress.create({
      data: {
        taskId: task.id,
        currentStep: 'Initialized',
        totalSteps: 1,
        currentProgress: 0
      }
    });

    auditLog(req.user!.id, 'TASK_CREATED', 'Task', { taskId: task.id, type }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    next(error);
  }
});

// Update task progress
router.patch('/:id/progress', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { progress, message, currentStep, totalSteps, metadata } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Users can only update their own tasks unless they're admin/operator
    if (req.user!.role === 'VIEWER' && task.userId !== req.user!.id) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const updateData: any = {};
    if (progress !== undefined) updateData.progress = Math.max(0, Math.min(100, progress));
    if (message !== undefined) updateData.message = message;
    if (metadata !== undefined) updateData.metadata = metadata;

    if (progress === 100) {
      updateData.status = TaskStatus.COMPLETED;
      updateData.completedAt = new Date();
    } else if (task.status === TaskStatus.PENDING) {
      updateData.status = TaskStatus.IN_PROGRESS;
      if (!task.startedAt) {
        updateData.startedAt = new Date();
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Update progress record
    await prisma.progress.upsert({
      where: { taskId: task.id },
      update: {
        currentStep: currentStep || 'In Progress',
        totalSteps: totalSteps || 1,
        currentProgress: progress !== undefined ? progress : undefined,
        message,
        metadata: metadata || {},
        lastUpdated: new Date()
      },
      create: {
        taskId: task.id,
        currentStep: currentStep || 'In Progress',
        totalSteps: totalSteps || 1,
        currentProgress: progress || 0,
        message,
        metadata: metadata || {}
      }
    });

    res.json({
      message: 'Task progress updated',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
});

// Cancel task
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new AppError('Cannot cancel completed or cancelled task', 400, 'INVALID_OPERATION');
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: TaskStatus.CANCELLED,
        message: 'Task cancelled by user'
      }
    });

    auditLog(req.user!.id, 'TASK_CANCELLED', 'Task', { taskId: task.id }, req.ip, req.get('user-agent'));

    res.json({
      message: 'Task cancelled successfully',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
});

export { router as tasksRouter };


