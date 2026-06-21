import { Router } from 'express';
import {
  getAdminStats, getAllUsers, updateUserRole,
  toggleUserActive, deleteUser, getAllProjects,
} from '../controllers/admin.controller';
import { updateColumn, deleteColumn, reorderColumns } from '../controllers/board.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);
router.get('/projects', getAllProjects);

// Board column management (admin)
router.patch('/board/columns/:id', updateColumn);
router.delete('/board/columns/:id', deleteColumn);
router.patch('/board/columns/reorder', reorderColumns);

export default router;
