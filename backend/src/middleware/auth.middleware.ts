import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authenticate user via JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    // Verify token
    const payload = verifyToken(token);
    
    if (!payload) {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
    
    // Attach user to request
    req.user = payload;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'staff') {
    throw new AppError('Admin access required', 403, 'FORBIDDEN');
  }
  
  next();
};

/**
 * Check if user is customer
 */
export const isCustomer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  
  if (req.user.role !== 'customer') {
    throw new AppError('Customer access required', 403, 'FORBIDDEN');
  }
  
  next();
};

/**
 * Optional authentication (doesn't throw error if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }
    
    next();
  } catch (error) {
    // Don't throw error for optional auth
    next();
  }
};

export default {
  authenticate,
  isAdmin,
  isCustomer,
  optionalAuth,
};
