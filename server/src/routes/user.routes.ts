import { Router } from 'express';
import {
  getProfile, updateProfile, uploadUserAvatar,
  changePassword, getUsers, getUserById,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadAvatar } from '../middleware/upload';
import { changePasswordSchema } from '../validations/auth.validation';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/avatar', uploadAvatar, uploadUserAvatar);
router.patch('/change-password', validate(changePasswordSchema), changePassword);
router.get('/:id', getUserById);

export default router;
