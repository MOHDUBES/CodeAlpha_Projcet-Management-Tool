import { Response, NextFunction } from 'express';
import Board from '../models/Board';
import Column from '../models/Column';
import Task from '../models/Task';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { emitToBoard } from '../config/socket';

// @desc    Get board with columns and tasks for a project
// @route   GET /api/projects/:projectId/board
export const getBoardByProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const board = await Board.findOne({ project: req.params.projectId, isDefault: true });
    if (!board) throw new AppError('Board not found', 404);

    const columns = await Column.find({ board: board._id }).sort({ position: 1 });

    const columnsWithTasks = await Promise.all(
      columns.map(async (col) => {
        const tasks = await Task.find({ column: col._id, isArchived: false })
          .populate('assignees', 'name avatar')
          .populate('reporter', 'name avatar')
          .sort({ position: 1 });

        return { ...col.toObject(), tasks };
      })
    );

    sendSuccess(res, { board, columns: columnsWithTasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new column
// @route   POST /api/projects/:projectId/board/columns
export const createColumn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const board = await Board.findOne({ project: req.params.projectId, isDefault: true });
    if (!board) throw new AppError('Board not found', 404);

    const maxPosition = await Column.findOne({ board: board._id }).sort({ position: -1 }).select('position');
    const position = maxPosition ? maxPosition.position + 1 : 0;

    const column = await Column.create({
      board: board._id,
      project: req.params.projectId,
      name: req.body.name,
      color: req.body.color || '#94a3b8',
      position,
    });

    board.columns.push(column._id as typeof column._id);
    await board.save();

    emitToBoard(board._id.toString(), 'board:column-added', column);

    sendCreated(res, column, 'Column created');
  } catch (error) {
    next(error);
  }
};

// @desc    Update column
// @route   PATCH /api/board/columns/:id
export const updateColumn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const column = await Column.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, color: req.body.color, taskLimit: req.body.taskLimit },
      { new: true }
    );
    if (!column) throw new AppError('Column not found', 404);

    emitToBoard(column.board.toString(), 'board:column-updated', column);

    sendSuccess(res, column, 'Column updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete column
// @route   DELETE /api/board/columns/:id
export const deleteColumn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) throw new AppError('Column not found', 404);

    if (column.isDefault) throw new AppError('Cannot delete default columns', 400);

    // Move tasks to backlog column
    const backlogColumn = await Column.findOne({ board: column.board, name: 'Backlog' });
    if (backlogColumn) {
      await Task.updateMany({ column: column._id }, { column: backlogColumn._id });
    }

    await Board.findByIdAndUpdate(column.board, { $pull: { columns: column._id } });
    await Column.findByIdAndDelete(req.params.id);

    emitToBoard(column.board.toString(), 'board:column-deleted', { columnId: req.params.id });

    sendSuccess(res, null, 'Column deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder columns
// @route   PATCH /api/board/columns/reorder
export const reorderColumns = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { columns } = req.body as { columns: Array<{ id: string; position: number }> };

    await Promise.all(
      columns.map(({ id, position }) => Column.findByIdAndUpdate(id, { position }))
    );

    sendSuccess(res, null, 'Columns reordered');
  } catch (error) {
    next(error);
  }
};
