import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { User, JWTPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5501';

export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

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

    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      req.user = response.data;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Failed to validate user',
        code: 401,
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Authentication failed',
      code: 500,
      timestamp: new Date()
    });
  }
};

export const checkDeploymentOwnership = async (userId: string, deploymentId: string): Promise<boolean> => {
  try {
    const redisClient = require('../redisClient').createRedisClient();
    await redisClient.connect();
    
    const deploymentData = await redisClient.hGet('deployments', deploymentId);
    if (!deploymentData) return false;
    
    const deployment = JSON.parse(deploymentData);
    await redisClient.disconnect();
    
    return deployment.userId === userId;
  } catch (error) {
    return false;
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