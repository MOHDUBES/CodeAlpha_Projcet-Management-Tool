import { Response, NextFunction } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/apiResponse';

// @desc    Global search
// @route   GET /api/search
export const globalSearch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, type, limit = '5' } = req.query as { q: string; type?: string; limit?: string };
    const userId = req.user!.userId;
    const maxResults = Math.min(parseInt(limit), 20);

    if (!q || q.trim().length < 2) {
      sendSuccess(res, { projects: [], tasks: [], members: [] });
      return;
    }

    const regex = { $regex: q, $options: 'i' };
    const userProjectIds = await Project.find({ 'members.user': userId }).select('_id');
    const projectIds = userProjectIds.map((p) => p._id);

    const results: { projects?: unknown[]; tasks?: unknown[]; members?: unknown[] } = {};

    if (!type || type === 'projects') {
      results.projects = await Project.find({
        'members.user': userId,
        $or: [{ name: regex }, { description: regex }],
      })
        .select('name description color logo status')
        .limit(maxResults);
    }

    if (!type || type === 'tasks') {
      results.tasks = await Task.find({
        project: { $in: projectIds },
        isArchived: false,
        $or: [{ title: regex }, { description: regex }],
      })
        .select('title description priority status project column dueDate')
        .populate('project', 'name color')
        .populate('column', 'name')
        .limit(maxResults);
    }

    if (!type || type === 'members') {
      results.members = await User.find({
        $or: [{ name: regex }, { email: regex }],
      })
        .select('name email avatar role')
        .limit(maxResults);
    }

    sendSuccess(res, results, 'Search results');
  } catch (error) {
    next(error);
  }
};
