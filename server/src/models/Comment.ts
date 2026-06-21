import mongoose, { Document, Schema } from 'mongoose';

export interface IReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  parentComment?: mongoose.Types.ObjectId;
  replies: mongoose.Types.ObjectId[];
  mentions: mongoose.Types.ObjectId[];
  reactions: IReaction[];
  attachments: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    emoji: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false }
);

const commentSchema = new Schema<IComment>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactions: [reactionSchema],
    attachments: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);
export default Comment;
