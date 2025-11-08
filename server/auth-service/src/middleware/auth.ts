import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyJWT } from '../services/jwt';
import { getUserById } from '../services/user';
import { getSession } from '../services/session';
import { User } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        code: 401,
        timestamp: new Date()
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    
    if (!payload) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        code: 401,
        timestamp: new Date()
      });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
        code: 401,
        timestamp: new Date()
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Authentication failed',
      code: 500,
      timestamp: new Date()
    });
  }
};

export const validateSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing session ID',
        code: 401,
        timestamp: new Date()
      });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session',
        code: 401,
        timestamp: new Date()
      });
    }

    if (req.user && req.user.id !== session.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session user mismatch',
        code: 401,
        timestamp: new Date()
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Session validation failed',
      code: 500,
      timestamp: new Date()
    });
  }
};

export const deploymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many deployments. Maximum 10 per hour.',
    code: 429,
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => {
    return req.user?.id || req.ip || 'anonymous';
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many authentication attempts. Try again later.',
    code: 429,
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false
});