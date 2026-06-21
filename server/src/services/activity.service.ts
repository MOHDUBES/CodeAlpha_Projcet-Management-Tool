import Activity, { ActivityAction } from '../models/Activity';
import { emitToProject } from '../config/socket';
import logger from '../utils/logger';

interface LogActivityParams {
  projectId: string;
  actorId: string;
  action: ActivityAction;
  entityType: 'project' | 'task' | 'board' | 'comment' | 'member';
  entityId: string;
  entityTitle?: string;
  metadata?: Record<string, unknown>;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    const activity = await Activity.create({
      project: params.projectId,
      actor: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityTitle: params.entityTitle,
      metadata: params.metadata || {},
    });

    await activity.populate('actor', 'name avatar');

    // Emit real-time activity to all project members
    emitToProject(params.projectId, 'activity:new', activity);
  } catch (error) {
    logger.error(`Failed to log activity: ${error}`);
  }
};
