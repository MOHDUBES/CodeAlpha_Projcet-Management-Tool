import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().max(10000).optional(),
    columnId: z.string().min(1, 'Column ID is required'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignees: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
    estimatedTime: z.number().min(0).optional(),
  }),
  params: z.object({
    projectId: z.string().min(1),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(10000).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'testing', 'done']).optional(),
    assignees: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    startDate: z.string().datetime().nullable().optional(),
    estimatedTime: z.number().min(0).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const moveTaskSchema = z.object({
  body: z.object({
    sourceColumnId: z.string().min(1, 'Source column ID required'),
    destinationColumnId: z.string().min(1, 'Destination column ID required'),
    sourceIndex: z.number().min(0),
    destinationIndex: z.number().min(0),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const addChecklistItemSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(500),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const addSubtaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    assignee: z.string().optional(),
    dueDate: z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});
