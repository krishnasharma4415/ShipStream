import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { ValidationError } from './error-handler';

const logger = createLogger('security');

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

// Repository URL validation
export const validateRepoUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const sanitized = sanitizeInput(url);
  
  // GitHub URL patterns
  const githubPatterns = [
    /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\.git)?$/,
    /^git@github\.com:[\w\-\.]+\/[\w\-\.]+\.git$/
  ];
  
  return githubPatterns.some(pattern => pattern.test(sanitized));
};

// Branch name validation
export const validateBranchName = (branch: string): boolean => {
  if (!branch || typeof branch !== 'string') return false;
  
  const sanitized = sanitizeInput(branch);
  
  // Valid git branch name pattern
  const branchPattern = /^[a-zA-Z0-9\/_\-\.]+$/;
  
  return branchPattern.test(sanitized) && 
         sanitized.length <= 100 &&
         !sanitized.startsWith('.') &&
         !sanitized.endsWith('.') &&
         !sanitized.includes('..');
};

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
};

// Request validation middleware
export const validateDeploymentRequest = (req: Request, res: Response, next: NextFunction) => {
  const { repoUrl, branch = 'main' } = req.body;
  
  if (!repoUrl) {
    logger.warn('Missing repository URL', { ip: req.ip });
    throw new ValidationError('Repository URL is required', 'repoUrl');
  }
  
  if (!validateRepoUrl(repoUrl)) {
    logger.warn('Invalid repository URL', { repoUrl: sanitizeInput(repoUrl), ip: req.ip });
    throw new ValidationError('Invalid repository URL. Only GitHub repositories are supported', 'repoUrl');
  }
  
  if (!validateBranchName(branch)) {
    logger.warn('Invalid branch name', { branch: sanitizeInput(branch), ip: req.ip });
    throw new ValidationError('Invalid branch name', 'branch');
  }
  
  // Sanitize inputs
  req.body.repoUrl = sanitizeInput(repoUrl);
  req.body.branch = sanitizeInput(branch);
  
  next();
};

// Rate limiting by IP and user
export const createAdvancedRateLimit = (windowMs: number, maxRequests: number, keyGenerator?: (req: Request) => string) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip || 'anonymous';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of requests.entries()) {
      if (now > v.resetTime) {
        requests.delete(k);
      }
    }
    
    const current = requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > current.resetTime) {
      current.count = 1;
      current.resetTime = now + windowMs;
    } else {
      current.count++;
    }
    
    requests.set(key, current);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - current.count).toString(),
      'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
    });
    
    if (current.count > maxRequests) {
      logger.rateLimitExceeded(req.ip || 'unknown', req.path);
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: `Too many requests. Maximum ${maxRequests} per ${windowMs / 1000} seconds.`,
        code: 429,
        timestamp: new Date().toISOString(),
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
    
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });
  
  next();
};

// Request size limiter
export const requestSizeLimit = (maxSize: number = 1024 * 1024) => { // 1MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      logger.warn('Request size exceeded', { 
        contentLength, 
        maxSize, 
        ip: req.ip,
        path: req.path 
      });
      
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request size exceeds maximum allowed size of ${maxSize} bytes`,
        code: 413,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

// IP whitelist/blacklist
export const ipFilter = (whitelist?: string[], blacklist?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (blacklist && blacklist.includes(clientIP)) {
      logger.warn('Blocked IP attempted access', { ip: clientIP, path: req.path });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied',
        code: 403,
        timestamp: new Date().toISOString()
      });
    }
    
    if (whitelist && !whitelist.includes(clientIP)) {
      logger.warn('Non-whitelisted IP attempted access', { ip: clientIP, path: req.path });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied',
        code: 403,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};