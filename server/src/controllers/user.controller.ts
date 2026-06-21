import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { uploadAvatar, deleteFromCloudinary } from '../services/cloudinary.service';
import { parsePagination, createPaginationMeta } from '../utils/pagination';

// @desc    Get user profile
// @route   GET /api/users/profile
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PATCH /api/users/profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, bio, jobTitle, timezone, notificationPreferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { name, bio, jobTitle, timezone, notificationPreferences },
      { new: true, runValidators: true }
    );
    sendSuccess(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
export const uploadUserAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'Please upload an image', 400);
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) throw new AppError('User not found', 404);

    // Delete old avatar
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    const { url, publicId } = await uploadAvatar(req.file.buffer);
    user.avatar = url;
    user.avatarPublicId = publicId;
    await user.save();

    sendSuccess(res, { avatar: url }, 'Avatar updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PATCH /api/users/change-password
export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.userId).select('+password +refreshTokens');
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    sendSuccess(res, null, 'Password changed. Please login again.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin + search for member invite)
// @route   GET /api/users
export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, sort, order } = req.query as Record<string, string>;
    const { search } = req.query as { search?: string };

    const pagination = parsePagination({ page: Number(page), limit: Number(limit), sort, order });
    
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email avatar role isEmailVerified isActive lastSeen createdAt')
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit),
      User.countDocuments(query),
    ]);

    sendSuccess(res, users, 'Users retrieved', 200, createPaginationMeta(pagination.page, pagination.limit, total));
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-refreshTokens');
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
