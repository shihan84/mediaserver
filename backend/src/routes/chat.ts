import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateRequest, createChatMessageSchema } from '../utils/validation';
import { processChatMessage } from '../services/aiAgent';

const router = Router();
const prisma = new PrismaClient();

// Get chat history
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Users can only see their own chat history unless they're admin/operator
    const where: any = {};
    if (req.user!.role === 'VIEWER') {
      where.userId = req.user!.id;
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.chatMessage.count({ where })
    ]);

    res.json({
      messages,
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

// Get chat message by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const message = await prisma.chatMessage.findUnique({
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

    if (!message) {
      throw new AppError('Chat message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Users can only see their own messages unless they're admin/operator
    if (req.user!.role === 'VIEWER' && message.userId !== req.user!.id) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    res.json({ message });
  } catch (error) {
    next(error);
  }
});

// Create chat message
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(createChatMessageSchema)(req.body);

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        userId: req.user!.id,
        message: data.message,
        context: data.context || {}
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

    // Process AI agent response asynchronously
    processChatMessage(message.id).catch((error) => {
      // Log error but don't fail the request
      console.error('Failed to process AI response:', error);
    });

    res.status(201).json({
      message: 'Chat message created successfully',
      chatMessage: message,
      note: 'AI response will be generated and available shortly'
    });
  } catch (error) {
    next(error);
  }
});

// Update chat message response (for AI agent)
router.patch('/:id/response', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { response, context } = req.body;

    const chatMessage = await prisma.chatMessage.findUnique({
      where: { id: req.params.id }
    });

    if (!chatMessage) {
      throw new AppError('Chat message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: req.params.id },
      data: {
        response,
        context: context || chatMessage.context
      }
    });

    res.json({
      message: 'Chat message updated successfully',
      chatMessage: updatedMessage
    });
  } catch (error) {
    next(error);
  }
});

export { router as chatRouter };


