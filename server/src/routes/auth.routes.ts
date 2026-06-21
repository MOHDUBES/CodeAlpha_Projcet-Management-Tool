import { Router } from 'express';
import {
  signup, login, logout, refreshToken, verifyEmail,
  forgotPassword, resetPassword, getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import {
  signupSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, refreshTokenSchema,
} from '../validations/auth.validation';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);

export default router;
