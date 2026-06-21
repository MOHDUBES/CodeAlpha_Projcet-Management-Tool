import { Router } from 'express';
import {
  createProject, getProjects, getProjectById,
  updateProject, deleteProject, archiveProject,
  inviteMember, removeMember, uploadLogo,
  getProjectActivity, getProjectStats,
} from '../controllers/project.controller';
import { getBoardByProject, createColumn } from '../controllers/board.controller';
import { createTask, getTasks } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadProjectLogo } from '../middleware/upload';
import {
  createProjectSchema, updateProjectSchema, inviteMemberSchema,
} from '../validations/project.validation';
import { createTaskSchema } from '../validations/task.validation';

const router = Router();

router.use(authenticate);

router.route('/')
  .get(getProjects)
  .post(validate(createProjectSchema), createProject);

router.route('/:id')
  .get(getProjectById)
  .patch(validate(updateProjectSchema), updateProject)
  .delete(deleteProject);

router.patch('/:id/archive', archiveProject);
router.post('/:id/logo', uploadProjectLogo, uploadLogo);
router.get('/:id/activity', getProjectActivity);
router.get('/:id/stats', getProjectStats);

// Member management
router.post('/:id/members/invite', validate(inviteMemberSchema), inviteMember);
router.delete('/:id/members/:userId', removeMember);

// Board routes (nested under project)
router.get('/:projectId/board', getBoardByProject);
router.post('/:projectId/board/columns', createColumn);

// Task routes (nested under project)
router.get('/:projectId/tasks', getTasks);
router.post('/:projectId/tasks', validate(createTaskSchema), createTask);

export default router;
