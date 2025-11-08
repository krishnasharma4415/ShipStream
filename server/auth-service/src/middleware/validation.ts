import { Request, Response, NextFunction } from 'express';

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

export const validateGitHubLogin = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(', '),
      code: 400,
      timestamp: new Date()
    });
  }

  next();
};

export const validateTokenRefresh = (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;
  const errors: string[] = [];

  if (!token) {
    errors.push('Token is required');
  } else if (typeof token !== 'string') {
    errors.push('Token must be a string');
  } else if (token.length > 2000) {
    errors.push('Token is too long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(', '),
      code: 400,
      timestamp: new Date()
    });
  }

  req.body.token = sanitizeInput(token);
  next();
};

export const validateLogout = (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.body;
  const errors: string[] = [];

  if (!sessionId) {
    errors.push('Session ID is required');
  } else if (typeof sessionId !== 'string') {
    errors.push('Session ID must be a string');
  } else if (!/^[a-f0-9-]{36}$/.test(sessionId)) {
    errors.push('Invalid session ID format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(', '),
      code: 400,
      timestamp: new Date()
    });
  }

  req.body.sessionId = sanitizeInput(sessionId);
  next();
};