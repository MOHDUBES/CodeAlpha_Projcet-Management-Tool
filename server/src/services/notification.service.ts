import Notification, { NotificationType } from '../models/Notification';
import { emitToUser } from '../config/socket';
import logger from '../utils/logger';

interface CreateNotificationParams {
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    projectId?: string;
    taskId?: string;
    commentId?: string;
    boardId?: string;
  };
}

export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    const notification = await Notification.create({
      recipient: params.recipientId,
      sender: params.senderId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {},
    });

    // Populate sender for real-time emit
    await notification.populate('sender', 'name avatar');

    // Emit real-time notification to the recipient
    emitToUser(params.recipientId, 'notification:new', notification);
  } catch (error) {
    logger.error(`Failed to create notification: ${error}`);
  }
};

export const createBulkNotifications = async (
  recipientIds: string[],
  params: Omit<CreateNotificationParams, 'recipientId'>
): Promise<void> => {
  try {
    const notifications = recipientIds.map((recipientId) => ({
      recipient: recipientId,
      sender: params.senderId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {},
    }));

    const created = await Notification.insertMany(notifications);

    // Emit to all recipients
    created.forEach((notification) => {
      emitToUser(notification.recipient.toString(), 'notification:new', notification);
    });
  } catch (error) {
    logger.error(`Failed to create bulk notifications: ${error}`);
  }
};
