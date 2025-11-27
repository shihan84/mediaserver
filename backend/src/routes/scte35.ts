import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireOperator } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { createScte35Schema, updateScte35Schema, createPrerollTemplateSchema } from '../utils/validation';
import { auditLog } from '../utils/auditLog';

const router = Router();
const prisma = new PrismaClient();

// Get all SCTE-35 markers
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = '1', limit = '50', type, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type) where.type = type;
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [markers, total] = await Promise.all([
      prisma.scte35Marker.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.scte35Marker.count({ where })
    ]);

    res.json({
      markers,
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

// Get SCTE-35 marker by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const marker = await prisma.scte35Marker.findUnique({
      where: { id: req.params.id }
    });

    if (!marker) {
      throw new AppError('SCTE-35 marker not found', 404, 'MARKER_NOT_FOUND');
    }

    res.json({ marker });
  } catch (error) {
    next(error);
  }
});

// Create SCTE-35 marker
router.post('/', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(createScte35Schema)(req.body);

    const marker = await prisma.scte35Marker.create({
      data
    });

    auditLog(req.user!.id, 'SCTE35_CREATED', 'SCTE35', { markerId: marker.id }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'SCTE-35 marker created successfully',
      marker
    });
  } catch (error) {
    next(error);
  }
});

// Update SCTE-35 marker
router.put('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(updateScte35Schema)(req.body);

    const existingMarker = await prisma.scte35Marker.findUnique({
      where: { id: req.params.id }
    });

    if (!existingMarker) {
      throw new AppError('SCTE-35 marker not found', 404, 'MARKER_NOT_FOUND');
    }

    const marker = await prisma.scte35Marker.update({
      where: { id: req.params.id },
      data
    });

    auditLog(req.user!.id, 'SCTE35_UPDATED', 'SCTE35', { markerId: marker.id, changes: data }, req.ip, req.get('user-agent'));

    res.json({
      message: 'SCTE-35 marker updated successfully',
      marker
    });
  } catch (error) {
    next(error);
  }
});

// Delete SCTE-35 marker
router.delete('/:id', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const marker = await prisma.scte35Marker.findUnique({
      where: { id: req.params.id }
    });

    if (!marker) {
      throw new AppError('SCTE-35 marker not found', 404, 'MARKER_NOT_FOUND');
    }

    await prisma.scte35Marker.delete({
      where: { id: req.params.id }
    });

    auditLog(req.user!.id, 'SCTE35_DELETED', 'SCTE35', { markerId: req.params.id }, req.ip, req.get('user-agent'));

    res.json({ message: 'SCTE-35 marker deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Create SCTE-35 preroll template
router.post('/templates/preroll', authenticate, requireOperator, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = validateRequest(createPrerollTemplateSchema)(req.body);
    const { name, duration = 30, programId, spliceId } = data;

    // Check if a preroll marker with this name already exists
    const existing = await prisma.scte35Marker.findFirst({
      where: {
        name: name,
        type: 'SPLICE_INSERT',
        cueOut: true,
        cueIn: false
      }
    });

    if (existing) {
      throw new AppError('A preroll marker with this name already exists', 409, 'DUPLICATE_ERROR');
    }

    // Create preroll template - CUE OUT at start, CUE IN after duration
    const prerollMarker = await prisma.scte35Marker.create({
      data: {
        name: name,
        type: 'SPLICE_INSERT',
        cueOut: true,
        cueIn: false,
        timeSignal: false,
        duration: duration,
        spliceId: spliceId || Math.floor(Math.random() * 0xFFFFFFFF),
        programId: programId || 1,
        outOfNetwork: true,
        autoReturn: true,
        breakDuration: duration,
        availNum: 1,
        availsExpected: 1,
        metadata: {
          template: 'preroll',
          description: 'Preroll ad break template',
          createdBy: req.user!.id,
          createdAt: new Date().toISOString()
        }
      }
    });

    auditLog(req.user!.id, 'SCTE35_PREROLL_CREATED', 'SCTE35', { markerId: prerollMarker.id, name, duration }, req.ip, req.get('user-agent'));

    res.status(201).json({
      message: 'SCTE-35 preroll template created successfully',
      marker: prerollMarker,
      template: {
        type: 'preroll',
        description: 'Preroll ad break that plays before main content',
        duration: duration,
        cueOut: true,
        cueIn: false
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as scte35Router };


