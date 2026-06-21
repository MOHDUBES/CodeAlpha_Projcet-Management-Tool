import { User } from './auth.types';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done';

export interface ChecklistItem {
  _id: string;
  text: string;
  isCompleted: boolean;
  completedBy?: User;
  completedAt?: string;
}

export interface Subtask {
  _id: string;
  title: string;
  isCompleted: boolean;
  assignee?: User;
  dueDate?: string;
}

export interface TimeEntry {
  _id: string;
  user: User;
  startTime: string;
  endTime?: string;
  duration: number;
  description?: string;
}

export interface FileAttachment {
  _id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: User;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  project: { _id: string; name: string; color: string };
  board: string;
  column: { _id: string; name: string; color: string };
  position: number;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: User[];
  reporter: User;
  labels: string[];
  tags: string[];
  dueDate?: string;
  startDate?: string;
  estimatedTime?: number;
  spentTime: number;
  timeEntries: TimeEntry[];
  checklist: ChecklistItem[];
  subtasks: Subtask[];
  attachments: FileAttachment[];
  parentTask?: string;
  watchers: User[];
  commentCount: number;
  isArchived: boolean;
  completedAt?: string;
  completedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  columnId: string;
  priority?: TaskPriority;
  assignees?: string[];
  labels?: string[];
  tags?: string[];
  dueDate?: string;
  startDate?: string;
  estimatedTime?: number;
}

export interface MoveTaskInput {
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
}
