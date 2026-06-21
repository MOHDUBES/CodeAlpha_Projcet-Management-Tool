import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { sendUnauthorized } from '../utils/apiResponse';
import User from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      sendUnauthorized(res, 'Authentication token required');
      return;
    }

    const decoded: JwtPayload = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('_id email role isActive');
    if (!user || !user.isActive) {
      sendUnauthorized(res, 'User not found or inactive');
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const decoded: JwtPayload = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
    next();
  } catch {
    next();
  }
};
