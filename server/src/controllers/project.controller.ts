import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project';
import Board from '../models/Board';
import Column from '../models/Column';
import Activity from '../models/Activity';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../services/activity.service';
import { createNotification } from '../services/notification.service';
import { sendProjectInvitationEmail } from '../services/email.service';
import { uploadProjectLogo, deleteFromCloudinary } from '../services/cloudinary.service';
import { parsePagination, createPaginationMeta } from '../utils/pagination';
import { emitToProject } from '../config/socket';

// Default Kanban columns for every new project
const DEFAULT_COLUMNS = [
  { name: 'Backlog', color: '#94a3b8', position: 0 },
  { name: 'Todo', color: '#60a5fa', position: 1 },
  { name: 'In Progress', color: '#f59e0b', position: 2 },
  { name: 'Review', color: '#a78bfa', position: 3 },
  { name: 'Testing', color: '#34d399', position: 4 },
  { name: 'Done', color: '#10b981', position: 5 },
];

// @desc    Create project
// @route   POST /api/projects
export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user!.userId;
    const { name, description, color, visibility, tags, startDate, dueDate } = req.body;

    // Create project
    const [project] = await Project.create([{
      name, description, color, visibility, tags, startDate, dueDate,
      owner: userId,
      members: [{ user: userId, role: 'owner', joinedAt: new Date() }],
    }], { session });

    // Create default board
    const [board] = await Board.create([{
      project: project._id,
      name: 'Main Board',
      isDefault: true,
      createdBy: userId,
    }], { session });

    // Create default columns
    const columnDocs = DEFAULT_COLUMNS.map((col) => ({
      ...col,
      board: board._id,
      project: project._id,
      isDefault: true,
    }));
    const columns = await Column.insertMany(columnDocs, { session });

    // Link columns to board
    board.columns = columns.map((c) => c._id as mongoose.Types.ObjectId);
    await board.save({ session });

    await session.commitTransaction();

    // Log activity
    await logActivity({
      projectId: project._id.toString(),
      actorId: userId,
      action: 'created',
      entityType: 'project',
      entityId: project._id.toString(),
      entityTitle: project.name,
    });

    const populatedProject = await Project.findById(project._id).populate('members.user', 'name email avatar');

    sendCreated(res, populatedProject, 'Project created successfully');
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all projects for user
// @route   GET /api/projects
export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page, limit, sort, order, status, search } = req.query as Record<string, string>;

    const pagination = parsePagination({ page: Number(page), limit: Number(limit), sort, order });

    const query: Record<string, unknown> = {
      'members.user': userId,
    };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar')
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit),
      Project.countDocuments(query),
    ]);

    sendSuccess(res, projects, 'Projects retrieved', 200, createPaginationMeta(pagination.page, pagination.limit, total));
  } catch (error) {
    next(error);
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
export const getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role bio jobTitle');

    if (!project) throw new AppError('Project not found', 404);

    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user!.userId
    );
    if (!isMember && req.user!.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PATCH /api/projects/:id
export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);

    const member = project.members.find((m) => m.user.toString() === req.user!.userId);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new AppError('Insufficient permissions to update project', 403);
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('members.user', 'name email avatar');

    await logActivity({
      projectId: req.params.id,
      actorId: req.user!.userId,
      action: 'updated',
      entityType: 'project',
      entityId: req.params.id,
      entityTitle: project.name,
    });

    emitToProject(req.params.id, 'project:updated', updated);

    sendSuccess(res, updated, 'Project updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Upload project logo
// @route   POST /api/projects/:id/logo
export const uploadLogo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'Please upload an image', 400);
      return;
    }

    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);

    if (project.logoPublicId) {
      await deleteFromCloudinary(project.logoPublicId);
    }

    const { url, publicId } = await uploadProjectLogo(req.file.buffer);
    project.logo = url;
    project.logoPublicId = publicId;
    await project.save();

    sendSuccess(res, { logo: url }, 'Logo updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Archive project
// @route   PATCH /api/projects/:id/archive
export const archiveProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);

    const member = project.members.find((m) => m.user.toString() === req.user!.userId);
    if (!member || member.role !== 'owner') {
      throw new AppError('Only project owner can archive', 403);
    }

    project.isArchived = true;
    project.archivedAt = new Date();
    project.status = 'archived';
    await project.save();

    await logActivity({
      projectId: project._id.toString(),
      actorId: req.user!.userId,
      action: 'archived',
      entityType: 'project',
      entityId: project._id.toString(),
      entityTitle: project.name,
    });

    sendSuccess(res, project, 'Project archived');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);

    const member = project.members.find((m) => m.user.toString() === req.user!.userId);
    if (!member || (member.role !== 'owner' && req.user!.role !== 'admin')) {
      throw new AppError('Only project owner can delete the project', 403);
    }

    await Project.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Project deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Invite member to project
// @route   POST /api/projects/:id/members/invite
export const inviteMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);

    const inviter = project.members.find((m) => m.user.toString() === req.user!.userId);
    if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
      throw new AppError('Insufficient permissions to invite members', 403);
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      // Send invitation email to non-registered user
      await sendProjectInvitationEmail(
        email,
        req.user!.email,
        project.name,
        `${process.env.CLIENT_URL}/signup?invite=${project._id}`
      );
      sendSuccess(res, null, 'Invitation sent to email');
      return;
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === userToInvite._id.toString());
    if (alreadyMember) {
      sendError(res, 'User is already a member', 409);
      return;
    }

    project.members.push({ user: userToInvite._id, role: role as 'admin' | 'member' | 'viewer', joinedAt: new Date() });
    await project.save();

    await createNotification({
      recipientId: userToInvite._id.toString(),
      senderId: req.user!.userId,
      type: 'project_invitation',
      title: 'Project Invitation',
      message: `You've been added to project "${project.name}"`,
      data: { projectId: project._id.toString() },
    });

    await logActivity({
      projectId: project._id.toString(),
      actorId: req.user!.userId,
      action: 'member_added',
      entityType: 'member',
      entityId: userToInvite._id.toString(),
      entityTitle: userToInvite.name,
    });

    await project.populate('members.user', 'name email avatar');
    emitToProject(project._id.toString(), 'project:member-added', { member: userToInvite });

    sendSuccess(res, project.members, 'Member added');
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
export const removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) throw new AppError('Project not found', 404);

    const requester = project.members.find((m) => m.user.toString() === req.user!.userId);
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    const memberToRemove = project.members.find((m) => m.user.toString() === userId);
    if (!memberToRemove) throw new AppError('Member not found', 404);
    if (memberToRemove.role === 'owner') throw new AppError('Cannot remove project owner', 400);

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    await createNotification({
      recipientId: userId,
      senderId: req.user!.userId,
      type: 'member_removed',
      title: 'Removed from Project',
      message: `You've been removed from project "${project.name}"`,
      data: { projectId: project._id.toString() },
    });

    emitToProject(project._id.toString(), 'project:member-removed', { userId });

    sendSuccess(res, null, 'Member removed');
  } catch (error) {
    next(error);
  }
};

// @desc    Get project activity
// @route   GET /api/projects/:id/activity
export const getProjectActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const pagination = parsePagination({ page: Number(page), limit: Number(limit) });

    const [activities, total] = await Promise.all([
      Activity.find({ project: req.params.id })
        .populate('actor', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      Activity.countDocuments({ project: req.params.id }),
    ]);

    sendSuccess(res, activities, 'Activities retrieved', 200, createPaginationMeta(pagination.page, pagination.limit, total));
  } catch (error) {
    next(error);
  }
};

// @desc    Get project stats
// @route   GET /api/projects/:id/stats
export const getProjectStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Task = (await import('../models/Task')).default;

    const [totalTasks, completedTasks, inProgressTasks, overdueTasksCount] = await Promise.all([
      Task.countDocuments({ project: req.params.id }),
      Task.countDocuments({ project: req.params.id, status: 'done' }),
      Task.countDocuments({ project: req.params.id, status: 'in_progress' }),
      Task.countDocuments({
        project: req.params.id,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
    ]);

    const tasksByPriority = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    sendSuccess(res, {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasksCount,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksByPriority,
    });
  } catch (error) {
    next(error);
  }
};
