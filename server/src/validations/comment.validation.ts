import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(5000),
    parentCommentId: z.string().optional(),
    mentions: z.array(z.string()).optional(),
  }),
  params: z.object({
    taskId: z.string().min(1),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const addReactionSchema = z.object({
  body: z.object({
    emoji: z.string().min(1).max(10),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});
