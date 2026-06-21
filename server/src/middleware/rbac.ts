import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { sendForbidden } from '../utils/apiResponse';
import { UserRole } from '../models/User';

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireProjectManagerOrAdmin = requireRole('admin', 'project_manager');
