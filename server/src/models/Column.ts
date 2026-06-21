import mongoose, { Document, Schema } from 'mongoose';

export interface IColumn extends Document {
  _id: mongoose.Types.ObjectId;
  board: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  name: string;
  color: string;
  position: number;
  tasks: mongoose.Types.ObjectId[];
  taskLimit?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<IColumn>(
  {
    board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true,
      maxlength: 50,
    },
    color: { type: String, default: '#94a3b8' },
    position: { type: Number, required: true, default: 0 },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    taskLimit: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

columnSchema.index({ board: 1, position: 1 });
columnSchema.index({ project: 1 });

const Column = mongoose.model<IColumn>('Column', columnSchema);
export default Column;
