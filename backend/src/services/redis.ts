import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', { error: err });
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

// Connect to Redis
if (!redisClient.isOpen) {
  redisClient.connect().catch((err) => {
    logger.error('Failed to connect to Redis', { error: err });
  });
}

export { redisClient };

// Helper functions
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error('Redis GET error', { error, key });
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttl?: number): Promise<void> => {
  try {
    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    logger.error('Redis SET error', { error, key });
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis DELETE error', { error, key });
  }
};


