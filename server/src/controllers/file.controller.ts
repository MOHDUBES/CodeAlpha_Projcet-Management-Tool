import { Response, NextFunction } from 'express';
import File from '../models/File';
import Task from '../models/Task';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary.service';

// @desc    Upload file attachment
// @route   POST /api/files/upload
export const uploadFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file provided', 400);
      return;
    }

    const { taskId, projectId, commentId } = req.body;

    const resourceType = req.file.mimetype.startsWith('image/') ? 'image' :
      req.file.mimetype.startsWith('video/') ? 'video' : 'raw';

    const folder = `pm-saas/${projectId || 'general'}/attachments`;
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, {
      folder,
      resourceType: resourceType as 'image' | 'video' | 'raw',
    });

    const file = await File.create({
      originalName: req.file.originalname,
      filename: publicId.split('/').pop() || req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url,
      publicId,
      resourceType,
      uploadedBy: req.user!.userId,
      project: projectId || undefined,
      task: taskId || undefined,
      comment: commentId || undefined,
    });

    // Link to task
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, { $push: { attachments: file._id } });
    }

    sendCreated(res, file, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
export const deleteFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) throw new AppError('File not found', 404);

    if (file.uploadedBy.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      throw new AppError('Not authorized', 403);
    }

    await deleteFromCloudinary(file.publicId, file.resourceType as 'image' | 'video' | 'raw');
    await File.findByIdAndDelete(req.params.id);

    if (file.task) {
      await Task.findByIdAndUpdate(file.task, { $pull: { attachments: file._id } });
    }

    sendSuccess(res, null, 'File deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Get files for a task
// @route   GET /api/files/task/:taskId
export const getTaskFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = await File.find({ task: req.params.taskId })
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });
    sendSuccess(res, files);
  } catch (error) {
    next(error);
  }
};
