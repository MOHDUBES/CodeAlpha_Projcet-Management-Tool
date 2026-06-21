import mongoose, { Document, Schema } from 'mongoose';

export interface IBoard extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  columns: mongoose.Types.ObjectId[];
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      maxlength: 100,
    },
    description: { type: String, maxlength: 500 },
    backgroundColor: { type: String, default: '#f1f5f9' },
    backgroundImage: { type: String },
    columns: [{ type: Schema.Types.ObjectId, ref: 'Column' }],
    isDefault: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

boardSchema.index({ project: 1 });

const Board = mongoose.model<IBoard>('Board', boardSchema);
export default Board;
