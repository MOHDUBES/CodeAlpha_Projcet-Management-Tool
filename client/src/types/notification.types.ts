import { User } from './auth.types';

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_due_soon'
  | 'task_overdue'
  | 'comment_added'
  | 'comment_replied'
  | 'mentioned'
  | 'project_invitation'
  | 'project_update'
  | 'member_joined'
  | 'member_removed';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  data: {
    projectId?: string;
    taskId?: string;
    commentId?: string;
    boardId?: string;
  };
  createdAt: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}
