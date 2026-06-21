import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  _id: mongoose.Types.ObjectId;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  uploadedBy: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'raw',
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
  },
  { timestamps: true }
);

fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ task: 1 });
fileSchema.index({ project: 1 });

const File = mongoose.model<IFile>('File', fileSchema);
export default File;
