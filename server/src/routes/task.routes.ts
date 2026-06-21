import { Router } from 'express';
import {
  getTaskById, updateTask, deleteTask, moveTask,
  toggleChecklistItem, addChecklistItem, deleteChecklistItem,
  addSubtask, getMyTasks,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateTaskSchema, moveTaskSchema, addChecklistItemSchema, addSubtaskSchema } from '../validations/task.validation';

const router = Router();

router.use(authenticate);

router.get('/me', getMyTasks);

router.route('/:id')
  .get(getTaskById)
  .patch(validate(updateTaskSchema), updateTask)
  .delete(deleteTask);

router.patch('/:id/move', validate(moveTaskSchema), moveTask);

// Checklist
router.post('/:id/checklist', validate(addChecklistItemSchema), addChecklistItem);
router.patch('/:id/checklist/:itemId', toggleChecklistItem);
router.delete('/:id/checklist/:itemId', deleteChecklistItem);

// Subtasks
router.post('/:id/subtasks', validate(addSubtaskSchema), addSubtask);

export default router;
