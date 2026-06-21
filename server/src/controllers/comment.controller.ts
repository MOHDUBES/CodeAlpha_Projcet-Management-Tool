import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import Task from '../models/Task';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { createBulkNotifications } from '../services/notification.service';
import { logActivity } from '../services/activity.service';
import { emitToTask } from '../config/socket';
import { parsePagination, createPaginationMeta } from '../utils/pagination';

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
export const getComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const pagination = parsePagination({ page: Number(page), limit: Number(limit) });

    const [comments, total] = await Promise.all([
      Comment.find({ task: req.params.taskId, parentComment: null, isDeleted: false })
        .populate('author', 'name avatar')
        .populate('mentions', 'name avatar')
        .populate({
          path: 'replies',
          match: { isDeleted: false },
          populate: { path: 'author', select: 'name avatar' },
          options: { sort: { createdAt: 1 } },
        })
        .populate('attachments')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      Comment.countDocuments({ task: req.params.taskId, parentComment: null, isDeleted: false }),
    ]);

    sendSuccess(res, comments, 'Comments retrieved', 200, createPaginationMeta(pagination.page, pagination.limit, total));
  } catch (error) {
    next(error);
  }
};

// @desc    Create comment
// @route   POST /api/tasks/:taskId/comments
export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content, parentCommentId, mentions } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) throw new AppError('Task not found', 404);

    const comment = await Comment.create({
      task: req.params.taskId,
      project: task.project,
      author: req.user!.userId,
      content,
      parentComment: parentCommentId || null,
      mentions: mentions || [],
    });

    // Add to parent's replies
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id },
      });
    }

    // Increment task comment count
    await Task.findByIdAndUpdate(req.params.taskId, { $inc: { commentCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name avatar')
      .populate('mentions', 'name avatar');

    // Notify mentions
    if (mentions?.length) {
      const mentionIds = mentions.filter((id: string) => id !== req.user!.userId);
      if (mentionIds.length > 0) {
        await createBulkNotifications(mentionIds, {
          senderId: req.user!.userId,
          type: 'mentioned',
          title: 'You were mentioned',
          message: `You were mentioned in a comment on "${task.title}"`,
          data: { projectId: task.project.toString(), taskId: task._id.toString(), commentId: comment._id.toString() },
        });
      }
    }

    // Notify task watchers
    const watcherIds = task.watchers
      .map((w) => w.toString())
      .filter((id) => id !== req.user!.userId);
    
    if (watcherIds.length > 0) {
      await createBulkNotifications(watcherIds, {
        senderId: req.user!.userId,
        type: 'comment_added',
        title: 'New Comment',
        message: `New comment on "${task.title}"`,
        data: { projectId: task.project.toString(), taskId: task._id.toString() },
      });
    }

    await logActivity({
      projectId: task.project.toString(),
      actorId: req.user!.userId,
      action: 'commented',
      entityType: 'comment',
      entityId: comment._id.toString(),
      entityTitle: task.title,
    });

    emitToTask(req.params.taskId, 'comment:created', populated);

    sendCreated(res, populated, 'Comment added');
  } catch (error) {
    next(error);
  }
};

// @desc    Update comment
// @route   PATCH /api/comments/:id
export const updateComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new AppError('Comment not found', 404);

    if (comment.author.toString() !== req.user!.userId) {
      throw new AppError('Not authorized to edit this comment', 403);
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const updated = await Comment.findById(comment._id).populate('author', 'name avatar');

    emitToTask(comment.task.toString(), 'comment:updated', updated);

    sendSuccess(res, updated, 'Comment updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new AppError('Comment not found', 404);

    if (comment.author.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await comment.save();

    await Task.findByIdAndUpdate(comment.task, { $inc: { commentCount: -1 } });

    emitToTask(comment.task.toString(), 'comment:deleted', { commentId: req.params.id });

    sendSuccess(res, null, 'Comment deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle reaction on comment
// @route   POST /api/comments/:id/reactions
export const toggleReaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emoji } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new AppError('Comment not found', 404);

    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const reactionIndex = comment.reactions.findIndex((r) => r.emoji === emoji);

    if (reactionIndex === -1) {
      comment.reactions.push({ emoji, users: [userId] });
    } else {
      const userIndex = comment.reactions[reactionIndex].users.findIndex(
        (u) => u.toString() === req.user!.userId
      );
      if (userIndex === -1) {
        comment.reactions[reactionIndex].users.push(userId);
      } else {
        comment.reactions[reactionIndex].users.splice(userIndex, 1);
        if (comment.reactions[reactionIndex].users.length === 0) {
          comment.reactions.splice(reactionIndex, 1);
        }
      }
    }

    await comment.save();

    emitToTask(comment.task.toString(), 'comment:reaction', {
      commentId: comment._id,
      reactions: comment.reactions,
    });

    sendSuccess(res, comment.reactions, 'Reaction updated');
  } catch (error) {
    next(error);
  }
};
