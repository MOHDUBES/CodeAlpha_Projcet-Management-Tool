import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email.service';

// @desc    Register user
// @route   POST /api/auth/signup
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    const user = new User({ name, email, password });
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email (non-blocking)
    sendVerificationEmail(email, name, verificationToken).catch(console.error);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    sendCreated(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account is deactivated. Please contact support.', 403);
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Limit stored refresh tokens to 5 (device-based)
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    user.lastSeen = new Date();
    await user.save();

    sendSuccess(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        bio: user.bio,
        jobTitle: user.jobTitle,
        timezone: user.timezone,
      },
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (req.user && refreshToken) {
      await User.findByIdAndUpdate(req.user.userId, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      sendUnauthorized(res, 'Refresh token required');
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+refreshTokens');

    if (!user || !user.refreshTokens.includes(token)) {
      sendUnauthorized(res, 'Invalid refresh token');
      return;
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (error) {
    if ((error as Error).name === 'JsonWebTokenError' || (error as Error).name === 'TokenExpiredError') {
      sendUnauthorized(res, 'Invalid or expired refresh token');
      return;
    }
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      sendError(res, 'Invalid or expired verification token', 400);
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    sendSuccess(res, null, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    sendPasswordResetEmail(email, user.name, resetToken).catch(console.error);

    sendSuccess(res, null, 'Password reset email sent');
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

    if (!user) {
      sendError(res, 'Invalid or expired reset token', 400);
      return;
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    sendSuccess(res, null, 'Password reset successfully. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    sendSuccess(res, user, 'User retrieved');
  } catch (error) {
    next(error);
  }
};
