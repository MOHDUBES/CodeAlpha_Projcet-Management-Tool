'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { apiGet, apiPatch } from '@/lib/api';
import { Notification } from '@/types/notification.types';
import { Loader2, Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiGet<{ notifications: Notification[], total: number, unreadCount: number }>('/notifications?limit=50');
      return res.data.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiPatch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success('All notifications marked as read');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiPatch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }
    
    if (notification.data?.projectId) {
      router.push(ROUTES.PROJECT(notification.data.projectId));
    }
  };

  const notifications = data?.notifications || [];

  return (
    <AppShell>
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">Stay updated with your team's activities.</p>
          </div>
          
          <button 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || !notifications.some(n => !n.isRead)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-border rounded-xl">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No notifications yet</h3>
            <p className="text-muted-foreground max-w-sm mt-1">When you receive assignments or mentions, they will appear here.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 flex gap-4 transition-colors cursor-pointer ${notification.isRead ? 'opacity-70 hover:bg-accent/30 hover:opacity-100' : 'bg-primary/5 hover:bg-primary/10'}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notification.sender ? (
                      <UserAvatar user={notification.sender} size="md" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Bell className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className={`font-semibold text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className={`text-sm mt-1 ${!notification.isRead ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="flex-shrink-0 flex items-center self-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
