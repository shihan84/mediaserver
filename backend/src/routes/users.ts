import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireAdmin, requireOperator } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { updateUserSchema } from '../utils/validation';
import { auditLog } from '../utils/auditLog';

const router = Router();
const prisma = new PrismaClient();

// Get all users (Admin/Operator only)
router.get('/', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = '1', limit = '50', role, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
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

// Get user by ID
router.get('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user (Admin only for role changes, users can update themselves)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.params.id;
    const isSelf = req.user!.id === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    // Users can only update themselves unless they're admin
    if (!isSelf && !isAdmin) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const data = validateRequest(updateUserSchema)(req.body);

    // Non-admins cannot change role or isActive
    if (!isAdmin && (data.role !== undefined || data.isActive !== undefined)) {
      throw new AppError('Cannot modify role or active status', 403, 'FORBIDDEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    auditLog(req.user!.id, 'USER_UPDATED', 'User', { userId, changes: data }, req.ip, req.get('user-agent'));

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.params.id;

    if (userId === req.user!.id) {
      throw new AppError('Cannot delete yourself', 400, 'INVALID_OPERATION');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    auditLog(req.user!.id, 'USER_DELETED', 'User', { userId }, req.ip, req.get('user-agent'));

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as usersRouter };


