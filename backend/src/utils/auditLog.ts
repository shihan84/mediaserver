import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export const auditLog = async (
  userId: string,
  action: string,
  resource: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details || {},
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error, userId, action, resource });
  }
};

export const getAuditLogs = async (
  userId?: string,
  resource?: string,
  limit: number = 100,
  offset: number = 0
) => {
  const where: any = {};
  if (userId) where.userId = userId;
  if (resource) where.resource = resource;

  return prisma.auditLog.findMany({
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
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset
  });
};


