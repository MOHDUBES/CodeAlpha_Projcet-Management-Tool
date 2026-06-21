import mongoose, { Document, Schema } from 'mongoose';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'moved'
  | 'assigned'
  | 'unassigned'
  | 'commented'
  | 'completed'
  | 'reopened'
  | 'priority_changed'
  | 'status_changed'
  | 'due_date_changed'
  | 'label_added'
  | 'label_removed'
  | 'member_added'
  | 'member_removed'
  | 'attachment_added'
  | 'attachment_removed'
  | 'checklist_item_completed'
  | 'subtask_completed';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  action: ActivityAction;
  entityType: 'project' | 'task' | 'board' | 'comment' | 'member';
  entityId: mongoose.Types.ObjectId;
  entityTitle?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'created', 'updated', 'deleted', 'archived', 'restored', 'moved',
        'assigned', 'unassigned', 'commented', 'completed', 'reopened',
        'priority_changed', 'status_changed', 'due_date_changed',
        'label_added', 'label_removed', 'member_added', 'member_removed',
        'attachment_added', 'attachment_removed',
        'checklist_item_completed', 'subtask_completed',
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['project', 'task', 'board', 'comment', 'member'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityTitle: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    timeseries: false,
  }
);

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ entityId: 1, createdAt: -1 });

const Activity = mongoose.model<IActivity>('Activity', activitySchema);
export default Activity;
