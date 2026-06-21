import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { parsePagination, createPaginationMeta } from '../utils/pagination';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
export const getAdminStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'done' }),
    ]);

    // User growth last 7 days
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    sendSuccess(res, {
      users: { total: totalUsers, active: activeUsers },
      projects: { total: totalProjects, active: activeProjects },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      charts: { userGrowth, tasksByStatus },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, sort, order, search, role } = req.query as Record<string, string>;
    const pagination = parsePagination({ page: Number(page), limit: Number(limit), sort, order });

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query)
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

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['admin', 'project_manager', 'member'].includes(role)) {
      sendError(res, 'Invalid role', 400);
      return;
    }

    if (req.params.id === req.user!.userId) {
      sendError(res, 'Cannot change your own role', 400);
      return;
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) throw new AppError('User not found', 404);

    sendSuccess(res, user, 'Role updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-active
export const toggleUserActive = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.params.id === req.user!.userId) {
      sendError(res, 'Cannot deactivate your own account', 400);
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    user.isActive = !user.isActive;
    await user.save();

    sendSuccess(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.params.id === req.user!.userId) {
      sendError(res, 'Cannot delete your own account', 400);
      return;
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    sendSuccess(res, null, 'User deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (admin)
// @route   GET /api/admin/projects
export const getAllProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, sort, order } = req.query as Record<string, string>;
    const pagination = parsePagination({ page: Number(page), limit: Number(limit), sort, order });

    const [projects, total] = await Promise.all([
      Project.find()
        .populate('owner', 'name email avatar')
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit),
      Project.countDocuments(),
    ]);

    sendSuccess(res, projects, 'Projects retrieved', 200, createPaginationMeta(pagination.page, pagination.limit, total));
  } catch (error) {
    next(error);
  }
};
