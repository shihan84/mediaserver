import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/inputSanitizer';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { scte35Router } from './routes/scte35';
import { channelsRouter } from './routes/channels';
import { schedulesRouter } from './routes/schedules';
import { streamsRouter } from './routes/streams';
import { tasksRouter } from './routes/tasks';
import { chatRouter } from './routes/chat';
import { metricsRouter } from './routes/metrics';
import { recordingsRouter } from './routes/recordings';
import { pushPublishingRouter } from './routes/pushPublishing';
import { scheduledChannelsRouter } from './routes/scheduledChannels';
import { omeRouter } from './routes/ome';
import { distributorsRouter } from './routes/distributors';
import { setupWebSocket } from './websocket/server';
import { swaggerSetup } from './config/swagger';
import { streamMonitorService } from './services/streamMonitor';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Input sanitization
app.use(sanitizeInput);

// Swagger documentation
swaggerSetup(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/scte35', scte35Router);
app.use('/api/channels', channelsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/streams', streamsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/chat', chatRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/recordings', recordingsRouter);
app.use('/api/push-publishing', pushPublishingRouter);
app.use('/api/scheduled-channels', scheduledChannelsRouter);
app.use('/api/ome', omeRouter);
app.use('/api/distributors', distributorsRouter);

// WebSocket setup
setupWebSocket(wss);

// Error handling (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server ready`);
  
  // Start stream monitor service for VOD fallback
  streamMonitorService.start();
});

export { app, httpServer, wss };

