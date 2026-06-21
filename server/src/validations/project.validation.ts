import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(2000).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    visibility: z.enum(['private', 'public', 'team']).optional(),
    tags: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(2000).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    status: z.enum(['active', 'archived', 'completed']).optional(),
    visibility: z.enum(['private', 'public', 'team']).optional(),
    tags: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    settings: z.object({
      allowMemberInvite: z.boolean().optional(),
      defaultTaskPriority: z.string().optional(),
      enableTimeTracking: z.boolean().optional(),
      enableSubtasks: z.boolean().optional(),
    }).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Project ID is required'),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['admin', 'member', 'viewer']).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});
