'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { getSocket, initializeSocket, disconnectSocket } from '@/lib/socket';
import { Notification } from '@/types/notification.types';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useSocket() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (initialized.current) {
        disconnectSocket();
        initialized.current = false;
      }
      return;
    }

    // Re-initialize socket with new token
    disconnectSocket();
    const socket = initializeSocket(accessToken);
    initialized.current = true;

    // Real-time notification
    socket.on('notification:new', (notification: Notification) => {
      addNotification(notification);
      toast(notification.message, {
        icon: '🔔',
        duration: 4000,
        style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' },
      });
    });

    // Board events
    socket.on('task:created', () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    });

    socket.on('task:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socket.on('task:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    });

    socket.on('task:moved', () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    });

    socket.on('project:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    socket.on('project:member-added', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    socket.on('project:member-removed', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    return () => {
      initialized.current = false;
    };
  }, [isAuthenticated, accessToken]);

  return getSocket();
}
