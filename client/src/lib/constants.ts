export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: '#22c55e', bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'high', label: 'High', color: '#f97316', bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444', bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
] as const;

export const TASK_STATUSES = [
  { value: 'backlog', label: 'Backlog', color: '#94a3b8' },
  { value: 'todo', label: 'Todo', color: '#60a5fa' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'review', label: 'Review', color: '#a78bfa' },
  { value: 'testing', label: 'Testing', color: '#34d399' },
  { value: 'done', label: 'Done', color: '#10b981' },
] as const;

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#64748b', '#1e293b',
];

export const DEFAULT_KANBAN_COLUMNS = [
  { name: 'Backlog', color: '#94a3b8' },
  { name: 'Todo', color: '#60a5fa' },
  { name: 'In Progress', color: '#f59e0b' },
  { name: 'Review', color: '#a78bfa' },
  { name: 'Testing', color: '#34d399' },
  { name: 'Done', color: '#10b981' },
];

export const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀', '✅', '🔥'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf', 'text/plain', 'video/mp4'];

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT: (id: string) => `/projects/${id}`,
  BOARD: (id: string) => `/projects/${id}/board`,
  TIMELINE: (id: string) => `/projects/${id}/timeline`,
  PROJECT_SETTINGS: (id: string) => `/projects/${id}/settings`,
  TASKS: '/tasks',
  CALENDAR: '/calendar',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/settings',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PROJECTS: '/admin/projects',
  ADMIN_ANALYTICS: '/admin/analytics',
};
