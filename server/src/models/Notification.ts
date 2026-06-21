import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_due_soon'
  | 'task_overdue'
  | 'comment_added'
  | 'comment_replied'
  | 'mentioned'
  | 'project_invitation'
  | 'project_update'
  | 'member_joined'
  | 'member_removed';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  data: {
    projectId?: string;
    taskId?: string;
    commentId?: string;
    boardId?: string;
  };
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_completed',
        'task_due_soon',
        'task_overdue',
        'comment_added',
        'comment_replied',
        'mentioned',
        'project_invitation',
        'project_update',
        'member_joined',
        'member_removed',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    data: {
      projectId: { type: String },
      taskId: { type: String },
      commentId: { type: String },
      boardId: { type: String },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
