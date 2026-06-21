import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Column from '../models/Column';
import Board from '../models/Board';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../services/activity.service';
import { createNotification, createBulkNotifications } from '../services/notification.service';
import { emitToBoard, emitToProject, emitToTask } from '../config/socket';
import { parsePagination, createPaginationMeta } from '../utils/pagination';

// @desc    Create task
// @route   POST /api/projects/:projectId/tasks
export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, columnId, priority, assignees, labels, tags, dueDate, startDate, estimatedTime } = req.body;

    const column = await Column.findById(columnId);
    if (!column) throw new AppError('Column not found', 404);

    const board = await Board.findById(column.board);
    if (!board) throw new AppError('Board not found', 404);

    const maxPositionTask = await Task.findOne({ column: columnId }).sort({ position: -1 }).select('position');
    const position = maxPositionTask ? maxPositionTask.position + 1 : 0;

    const task = await Task.create({
      title,
      description,
      project: req.params.projectId,
      board: board._id,
      column: columnId,
      position,
      priority: priority || 'medium',
      assignees: assignees || [],
      reporter: req.user!.userId,
      labels: labels || [],
      tags: tags || [],
      dueDate,
      startDate,
      estimatedTime,
    });

    // Update column's task list
    await Column.findByIdAndUpdate(columnId, { $push: { tasks: task._id } });

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name avatar email')
      .populate('reporter', 'name avatar');

    // Notify assignees
    if (assignees?.length) {
      const assigneeIds = assignees.filter((id: string) => id !== req.user!.userId);
      if (assigneeIds.length > 0) {
        await createBulkNotifications(assigneeIds, {
          senderId: req.user!.userId,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You've been assigned to "${title}"`,
          data: { projectId: req.params.projectId, taskId: task._id.toString() },
        });
      }
    }

    await logActivity({
      projectId: req.params.projectId,
      actorId: req.user!.userId,
      action: 'created',
      entityType: 'task',
      entityId: task._id.toString(),
      entityTitle: title,
    });

    emitToBoard(board._id.toString(), 'task:created', { task: populatedTask, columnId });

    sendCreated(res, populatedTask, 'Task created');
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks (with filters)
// @route   GET /api/projects/:projectId/tasks
export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, sort, order, priority, status, assignee, search, label, tag, dueBefore, dueAfter } = req.query as Record<string, string>;
    const pagination = parsePagination({ page: Number(page), limit: Number(limit), sort, order });

    const query: Record<string, unknown> = {
      project: req.params.projectId,
      isArchived: false,
    };

    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (assignee) query.assignees = assignee;
    if (label) query.labels = label;
    if (tag) query.tags = tag;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (dueBefore || dueAfter) {
      query.dueDate = {};
      if (dueBefore) (query.dueDate as Record<string, unknown>).$lte = new Date(dueBefore);
      if (dueAfter) (query.dueDate as Record<string, unknown>).$gte = new Date(dueAfter);
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignees', 'name avatar email')
        .populate('reporter', 'name avatar')
        .populate('column', 'name color')
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit),
      Task.countDocuments(query),
    ]);

    sendSuccess(res, tasks, 'Tasks retrieved', 200, createPaginationMeta(pagination.page, pagination.limit, total));
  } catch (error) {
    next(error);
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
export const getTaskById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name avatar email')
      .populate('reporter', 'name avatar email')
      .populate('column', 'name color')
      .populate('attachments')
      .populate('subtasks.assignee', 'name avatar')
      .populate('checklist.completedBy', 'name');

    if (!task) throw new AppError('Task not found', 404);
    sendSuccess(res, task);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PATCH /api/tasks/:id
export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new AppError('Task not found', 404);

    const oldData = {
      priority: task.priority,
      status: task.status,
      assignees: task.assignees.map((a) => a.toString()),
    };

    // Track completion
    if (req.body.status === 'done' && task.status !== 'done') {
      req.body.completedAt = new Date();
      req.body.completedBy = req.user!.userId;
    } else if (req.body.status && req.body.status !== 'done') {
      req.body.completedAt = null;
      req.body.completedBy = null;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignees', 'name avatar email')
      .populate('reporter', 'name avatar');

    // Notify new assignees
    if (req.body.assignees) {
      const newAssignees = req.body.assignees.filter(
        (id: string) => !oldData.assignees.includes(id) && id !== req.user!.userId
      );
      if (newAssignees.length > 0) {
        await createBulkNotifications(newAssignees, {
          senderId: req.user!.userId,
          type: 'task_assigned',
          title: 'Assigned to Task',
          message: `You've been assigned to "${task.title}"`,
          data: { projectId: task.project.toString(), taskId: task._id.toString() },
        });
      }
    }

    let action = 'updated';
    if (req.body.status === 'done') action = 'completed';
    else if (req.body.priority && req.body.priority !== oldData.priority) action = 'priority_changed';

    await logActivity({
      projectId: task.project.toString(),
      actorId: req.user!.userId,
      action: action as 'updated' | 'completed' | 'priority_changed',
      entityType: 'task',
      entityId: task._id.toString(),
      entityTitle: task.title,
      metadata: { changes: req.body, oldData },
    });

    emitToBoard(task.board.toString(), 'task:updated', updated);
    emitToTask(task._id.toString(), 'task:updated', updated);

    sendSuccess(res, updated, 'Task updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Move task (drag and drop)
// @route   PATCH /api/tasks/:id/move
export const moveTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sourceColumnId, destinationColumnId, sourceIndex, destinationIndex } = req.body;
    const task = await Task.findById(req.params.id).session(session);
    if (!task) throw new AppError('Task not found', 404);

    // Remove from source column
    await Column.findByIdAndUpdate(
      sourceColumnId,
      { $pull: { tasks: task._id } },
      { session }
    );

    // Add to destination column
    const destColumn = await Column.findById(destinationColumnId).session(session);
    if (!destColumn) throw new AppError('Destination column not found', 404);

    destColumn.tasks.splice(destinationIndex, 0, task._id as mongoose.Types.ObjectId);
    await destColumn.save({ session });

    // Determine new status based on column name
    const statusMap: Record<string, string> = {
      'Backlog': 'backlog',
      'Todo': 'todo',
      'In Progress': 'in_progress',
      'Review': 'review',
      'Testing': 'testing',
      'Done': 'done',
    };
    const newStatus = statusMap[destColumn.name] || task.status;

    // Update task
    task.column = destColumn._id as mongoose.Types.ObjectId;
    task.position = destinationIndex;
    task.status = newStatus as typeof task.status;
    if (newStatus === 'done') {
      task.completedAt = new Date();
      task.completedBy = new mongoose.Types.ObjectId(req.user!.userId);
    }
    await task.save({ session });

    await session.commitTransaction();

    await logActivity({
      projectId: task.project.toString(),
      actorId: req.user!.userId,
      action: 'moved',
      entityType: 'task',
      entityId: task._id.toString(),
      entityTitle: task.title,
      metadata: { from: sourceColumnId, to: destinationColumnId },
    });

    emitToBoard(task.board.toString(), 'task:moved', {
      taskId: task._id,
      sourceColumnId,
      destinationColumnId,
      sourceIndex,
      destinationIndex,
      newStatus,
    });

    sendSuccess(res, task, 'Task moved');
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new AppError('Task not found', 404);

    await Column.findByIdAndUpdate(task.column, { $pull: { tasks: task._id } });
    await Task.findByIdAndDelete(req.params.id);

    await logActivity({
      projectId: task.project.toString(),
      actorId: req.user!.userId,
      action: 'deleted',
      entityType: 'task',
      entityId: task._id.toString(),
      entityTitle: task.title,
    });

    emitToBoard(task.board.toString(), 'task:deleted', { taskId: req.params.id, columnId: task.column });

    sendSuccess(res, null, 'Task deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle checklist item
// @route   PATCH /api/tasks/:id/checklist/:itemId
export const toggleChecklistItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw new AppError('Task not found', 404);

    const item = task.checklist.id(req.params.itemId);
    if (!item) throw new AppError('Checklist item not found', 404);

    item.isCompleted = !item.isCompleted;
    if (item.isCompleted) {
      item.completedBy = new mongoose.Types.ObjectId(req.user!.userId);
      item.completedAt = new Date();
    } else {
      item.completedBy = undefined;
      item.completedAt = undefined;
    }
    await task.save();

    emitToTask(task._id.toString(), 'task:checklist-updated', { taskId: task._id, item });

    sendSuccess(res, task.checklist, 'Checklist updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Add checklist item
// @route   POST /api/tasks/:id/checklist
export const addChecklistItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { checklist: { text: req.body.text, isCompleted: false } } },
      { new: true }
    );
    if (!task) throw new AppError('Task not found', 404);
    sendSuccess(res, task.checklist, 'Item added');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete checklist item
// @route   DELETE /api/tasks/:id/checklist/:itemId
export const deleteChecklistItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $pull: { checklist: { _id: req.params.itemId } } },
      { new: true }
    );
    if (!task) throw new AppError('Task not found', 404);
    sendSuccess(res, task.checklist, 'Item deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Add subtask
// @route   POST /api/tasks/:id/subtasks
export const addSubtask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { subtasks: req.body } },
      { new: true }
    ).populate('subtasks.assignee', 'name avatar');
    if (!task) throw new AppError('Task not found', 404);
    sendSuccess(res, task.subtasks, 'Subtask added');
  } catch (error) {
    next(error);
  }
};

// @desc    Get my tasks
// @route   GET /api/tasks/me
export const getMyTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, priority, page, limit } = req.query as Record<string, string>;
    const pagination = parsePagination({ page: Number(page), limit: Number(limit) });

    const query: Record<string, unknown> = { assignees: req.user!.userId, isArchived: false };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('project', 'name color')
        .populate('assignees', 'name avatar')
        .populate('column', 'name')
        .sort({ dueDate: 1, priority: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      Task.countDocuments(query),
    ]);

    sendSuccess(res, tasks, 'My tasks', 200, createPaginationMeta(pagination.page, pagination.limit, total));
  } catch (error) {
    next(error);
  }
};
