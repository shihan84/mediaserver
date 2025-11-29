import { z } from 'zod';

const uuidSchema = z.string().uuid();

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
  isActive: z.boolean().optional().default(true)
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8).optional()
});

// SCTE-35 schemas
export const createScte35Schema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['SPLICE_INSERT', 'TIME_SIGNAL', 'SPLICE_NULL']),
  cueOut: z.boolean().optional().default(false),
  cueIn: z.boolean().optional().default(false),
  timeSignal: z.boolean().optional().default(false),
  spliceId: z.number().int().optional(),
  programId: z.number().int().optional(),
  duration: z.number().int().optional(),
  outOfNetwork: z.boolean().optional().default(false),
  autoReturn: z.boolean().optional().default(false),
  breakDuration: z.number().int().optional(),
  availNum: z.number().int().optional(),
  availsExpected: z.number().int().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateScte35Schema = createScte35Schema.partial();

export const createPrerollTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  duration: z.number().int().positive().default(30),
  programId: z.number().int().optional(),
  spliceId: z.number().int().optional()
});

// Channel schemas
export const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  appName: z.string().min(1).max(255).optional().default('app'), // OME application name
  streamKey: z.string().min(1).max(255),
  config: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  vodFallbackEnabled: z.boolean().optional().default(false),
  vodFallbackFiles: z.array(z.string()).optional(),
  vodFallbackDelay: z.number().int().positive().optional().default(5)
});

export const updateChannelSchema = createChannelSchema.partial().extend({
  isActive: z.boolean().optional(),
  streamKey: z.string().min(1).max(255).optional(),
  vodFallbackEnabled: z.boolean().optional(),
  vodFallbackFiles: z.array(z.string()).optional(),
  vodFallbackDelay: z.number().int().positive().optional()
});

// Schedule schemas
export const createScheduleSchema = z.object({
  channelId: uuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().optional(),
  playlist: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  channelId: uuidSchema.optional()
});

// Distributor schemas
const distributorBaseSchema = z.object({
  channelId: uuidSchema,
  name: z.string().min(1).max(255),
  type: z.enum(['HLS_MPD', 'SRT']),
  hlsUrl: z.string().url().optional(),
  mpdUrl: z.string().url().optional(),
  srtEndpoint: z.string().url().optional(),
  srtStreamKey: z.string().optional(),
  scte35Enabled: z.boolean().optional().default(true),
  prerollMarkerId: z.string().uuid().optional(),
  autoPreroll: z.boolean().optional().default(false),
  config: z.record(z.any()).optional()
});

export const createDistributorSchema = distributorBaseSchema.refine((data) => {
  if (data.type === 'HLS_MPD') {
    return data.hlsUrl || data.mpdUrl;
  }
  if (data.type === 'SRT') {
    return data.srtEndpoint && data.srtStreamKey;
  }
  return true;
}, {
  message: "HLS_MPD requires hlsUrl or mpdUrl, SRT requires srtEndpoint and srtStreamKey"
});

export const updateDistributorSchema = distributorBaseSchema.partial().extend({
  channelId: uuidSchema.optional()
}).refine((data) => {
  if (data.type === 'HLS_MPD') {
    return data.hlsUrl || data.mpdUrl;
  }
  if (data.type === 'SRT') {
    return data.srtEndpoint && data.srtStreamKey;
  }
  return true;
}, {
  message: "HLS_MPD requires hlsUrl or mpdUrl, SRT requires srtEndpoint and srtStreamKey"
});

// Task schemas
export const createTaskSchema = z.object({
  type: z.string().min(1),
  message: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateTaskProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
  message: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Chat schemas
export const createChatMessageSchema = z.object({
  message: z.string().min(1),
  context: z.record(z.any()).optional()
});

export const updateChatResponseSchema = z.object({
  response: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

// Validation helper
export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return (data: unknown): z.infer<T> => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        throw new Error(`Validation error: ${JSON.stringify(formatted)}`);
      }
      throw error;
    }
  };
}
