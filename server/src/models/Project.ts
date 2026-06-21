import mongoose, { Document, Schema } from 'mongoose';

export type ProjectStatus = 'active' | 'archived' | 'completed';
export type ProjectVisibility = 'private' | 'public' | 'team';

export interface IProjectMember {
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  logo?: string;
  logoPublicId?: string;
  color: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  owner: mongoose.Types.ObjectId;
  members: IProjectMember[];
  tags: string[];
  startDate?: Date;
  dueDate?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  settings: {
    allowMemberInvite: boolean;
    defaultTaskPriority: string;
    enableTimeTracking: boolean;
    enableSubtasks: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    logo: { type: String },
    logoPublicId: { type: String },
    color: { type: String, default: '#6366f1' },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    visibility: {
      type: String,
      enum: ['private', 'public', 'team'],
      default: 'private',
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [projectMemberSchema],
    tags: [{ type: String, trim: true }],
    startDate: { type: Date },
    dueDate: { type: Date },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    settings: {
      allowMemberInvite: { type: Boolean, default: true },
      defaultTaskPriority: { type: String, default: 'medium' },
      enableTimeTracking: { type: Boolean, default: true },
      enableSubtasks: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Indexes
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ name: 'text', description: 'text' });

const Project = mongoose.model<IProject>('Project', projectSchema);
export default Project;
