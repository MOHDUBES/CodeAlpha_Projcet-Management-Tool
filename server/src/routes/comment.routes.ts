import { Router } from 'express';
import {
  getComments, createComment, updateComment,
  deleteComment, toggleReaction,
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentSchema, updateCommentSchema, addReactionSchema } from '../validations/comment.validation';

const router = Router();

router.use(authenticate);

// Task comments
router.get('/task/:taskId', getComments);
router.post('/task/:taskId', validate(createCommentSchema), createComment);

// Individual comment operations
router.patch('/:id', validate(updateCommentSchema), updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/reactions', validate(addReactionSchema), toggleReaction);

export default router;
