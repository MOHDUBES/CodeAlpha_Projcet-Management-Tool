import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export let io: SocketIOServer;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
        userId: string;
        role: string;
      };
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId} [${socket.id}]`);

    // Join personal room for direct notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join project rooms
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.info(`User ${socket.userId} joined project room: ${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Join board room
    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    // Typing indicator for comments
    socket.on('typing:start', ({ taskId }: { taskId: string }) => {
      socket.to(`task:${taskId}`).emit('user:typing', {
        userId: socket.userId,
        taskId,
      });
    });

    socket.on('typing:stop', ({ taskId }: { taskId: string }) => {
      socket.to(`task:${taskId}`).emit('user:stopped-typing', {
        userId: socket.userId,
        taskId,
      });
    });

    // Join task room for live comment updates
    socket.on('join:task', (taskId: string) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('leave:task', (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.userId} - Reason: ${reason}`);
    });
  });

  return io;
};

export const emitToProject = (projectId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

export const emitToBoard = (boardId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`board:${boardId}`).emit(event, data);
  }
};

export const emitToTask = (taskId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`task:${taskId}`).emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};
