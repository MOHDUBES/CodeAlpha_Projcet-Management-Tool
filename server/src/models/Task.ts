import mongoose, { Document, Schema } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done';

export interface IChecklistItem {
  _id: mongoose.Types.ObjectId;
  text: string;
  isCompleted: boolean;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
}

export interface ISubtask {
  _id: mongoose.Types.ObjectId;
  title: string;
  isCompleted: boolean;
  assignee?: mongoose.Types.ObjectId;
  dueDate?: Date;
}

export interface ITimeEntry {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  project: mongoose.Types.ObjectId;
  board: mongoose.Types.ObjectId;
  column: mongoose.Types.ObjectId;
  position: number;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: mongoose.Types.ObjectId[];
  reporter: mongoose.Types.ObjectId;
  labels: string[];
  tags: string[];
  dueDate?: Date;
  startDate?: Date;
  estimatedTime?: number; // in minutes
  spentTime: number; // in minutes
  timeEntries: ITimeEntry[];
  checklist: IChecklistItem[];
  subtasks: ISubtask[];
  attachments: mongoose.Types.ObjectId[];
  parentTask?: mongoose.Types.ObjectId;
  dependencies: mongoose.Types.ObjectId[];
  watchers: mongoose.Types.ObjectId[];
  commentCount: number;
  isArchived: boolean;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const checklistItemSchema = new Schema<IChecklistItem>({
  text: { type: String, required: true, maxlength: 500 },
  isCompleted: { type: Boolean, default: false },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
});

const subtaskSchema = new Schema<ISubtask>({
  title: { type: String, required: true, maxlength: 200 },
  isCompleted: { type: Boolean, default: false },
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
});

const timeEntrySchema = new Schema<ITimeEntry>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  description: { type: String, maxlength: 300 },
});

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, maxlength: 10000 },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    column: { type: Schema.Types.ObjectId, ref: 'Column', required: true },
    position: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    labels: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    dueDate: { type: Date },
    startDate: { type: Date },
    estimatedTime: { type: Number },
    spentTime: { type: Number, default: 0 },
    timeEntries: [timeEntrySchema],
    checklist: [checklistItemSchema],
    subtasks: [subtaskSchema],
    attachments: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
taskSchema.index({ project: 1 });
taskSchema.index({ board: 1 });
taskSchema.index({ column: 1, position: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ reporter: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task;
