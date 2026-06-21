'use client';

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './constants';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const initializeSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection warning:', error.message);
    if (error.message === 'Invalid token' || error.message === 'Authentication required') {
      socket?.disconnect();
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinProjectRoom = (projectId: string): void => {
  socket?.emit('join:project', projectId);
};

export const leaveProjectRoom = (projectId: string): void => {
  socket?.emit('leave:project', projectId);
};

export const joinBoardRoom = (boardId: string): void => {
  socket?.emit('join:board', boardId);
};

export const joinTaskRoom = (taskId: string): void => {
  socket?.emit('join:task', taskId);
};

export const leaveTaskRoom = (taskId: string): void => {
  socket?.emit('leave:task', taskId);
};

export const emitTypingStart = (taskId: string): void => {
  socket?.emit('typing:start', { taskId });
};

export const emitTypingStop = (taskId: string): void => {
  socket?.emit('typing:stop', { taskId });
};
