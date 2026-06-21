import { User } from './auth.types';

export type ProjectStatus = 'active' | 'archived' | 'completed';
export type ProjectVisibility = 'private' | 'public' | 'team';
export type ProjectMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ProjectMember {
  user: User;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface ProjectSettings {
  allowMemberInvite: boolean;
  defaultTaskPriority: string;
  enableTimeTracking: boolean;
  enableSubtasks: boolean;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  color: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  owner: User;
  members: ProjectMember[];
  tags: string[];
  startDate?: string;
  dueDate?: string;
  isArchived: boolean;
  archivedAt?: string;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasksCount: number;
  completionRate: number;
  tasksByPriority: Array<{ _id: string; count: number }>;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  visibility?: ProjectVisibility;
  tags?: string[];
  startDate?: string;
  dueDate?: string;
}
