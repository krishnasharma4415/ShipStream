import { Request, Response, NextFunction } from 'express';
import { generateSecureToken } from '../utils/encryption';
import redisClient from '../config/redis';

export interface CSRFRequest extends Request {
  csrfToken?: string;
}

export const generateCSRFToken = async (sessionId: string): Promise<string> => {
  const token = generateSecureToken(16);
  await redisClient.setEx(`csrf:${sessionId}`, 3600, token);
  return token;
};

export const validateCSRFToken = async (sessionId: string, token: string): Promise<boolean> => {
  try {
    const storedToken = await redisClient.get(`csrf:${sessionId}`);
    return storedToken === token;
  } catch {
    return false;
  }
};

export const csrfProtection = async (req: CSRFRequest, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const sessionId = req.headers['x-session-id'] as string;
  const csrfToken = req.headers['x-csrf-token'] as string;

  if (!sessionId || !csrfToken) {
    return res.status(403).json({
      error: 'CSRF Protection',
      message: 'Missing CSRF token or session ID',
      code: 403,
      timestamp: new Date()
    });
  }

  const isValid = await validateCSRFToken(sessionId, csrfToken);
  if (!isValid) {
    return res.status(403).json({
      error: 'CSRF Protection',
      message: 'Invalid CSRF token',
      code: 403,
      timestamp: new Date()
    });
  }

  next();
};