import { Router } from 'express';
import { uploadFile, deleteFile, getTaskFiles } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadLimiter, uploadSingle, uploadFile);
router.get('/task/:taskId', getTaskFiles);
router.delete('/:id', deleteFile);

export default router;
