import { Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/apiResponse';
import { parsePagination, createPaginationMeta } from '../utils/pagination';

// @desc    Get notifications
// @route   GET /api/notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, unread } = req.query as Record<string, string>;
    const pagination = parsePagination({ page: Number(page), limit: Number(limit) });

    const query: Record<string, unknown> = { recipient: req.user!.userId };
    if (unread === 'true') query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user!.userId, isRead: false }),
    ]);

    sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved', 200,
      createPaginationMeta(pagination.page, pagination.limit, total)
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!.userId },
      { isRead: true, readAt: new Date() }
    );
    sendSuccess(res, null, 'Marked as read');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.updateMany(
      { recipient: req.user!.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user!.userId });
    sendSuccess(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user!.userId, isRead: false });
    sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
};
