import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export const setupWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    ws.isAlive = true;

    // Authenticate WebSocket connection
    const token = req.url?.split('token=')[1]?.split('&')[0];
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        username: string;
        role: string;
      };

      ws.userId = decoded.id;
      logger.info(`WebSocket client connected: ${decoded.username} (${decoded.id})`);
    } catch (error) {
      logger.warn('WebSocket authentication failed', { error });
      ws.close(1008, 'Invalid token');
      return;
    }

    // Handle ping/pong for connection keepalive
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        logger.error('WebSocket message error', { error });
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle close
    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${ws.userId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', { error, userId: ws.userId });
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established'
    }));
  });

  // Ping all clients every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
};

const handleWebSocketMessage = async (
  ws: AuthenticatedWebSocket,
  message: any
) => {
  const { type, data } = message;

  switch (type) {
    case 'subscribe':
      // Subscribe to updates (tasks, progress, etc.)
      ws.send(JSON.stringify({
        type: 'subscribed',
        channel: data.channel
      }));
      break;

    case 'unsubscribe':
      // Unsubscribe from updates
      ws.send(JSON.stringify({
        type: 'unsubscribed',
        channel: data.channel
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
};

// Broadcast progress update to all connected clients
export const broadcastProgress = async (taskId: string, progress: any) => {
  // This would be called from your task processing logic
  // Implementation depends on how you want to manage WebSocket connections
};

// Broadcast task update
export const broadcastTaskUpdate = async (taskId: string, task: any) => {
  // Broadcast task updates to subscribed clients
};

// Broadcast chat message
export const broadcastChatMessage = async (message: any) => {
  // Broadcast chat messages to relevant clients
};


