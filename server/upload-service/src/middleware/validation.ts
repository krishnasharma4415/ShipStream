import { Request, Response, NextFunction } from 'express';

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

export const validateRepoUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' && urlObj.pathname.includes('/');
  } catch {
    return false;
  }
};

export const validateBranch = (branch: string): boolean => {
  if (!branch || typeof branch !== 'string') return false;
  return /^[a-zA-Z0-9._/-]+$/.test(branch) && branch.length <= 100;
};

export const validateDeployment = (req: Request, res: Response, next: NextFunction) => {
  const { repoUrl, branch = 'main' } = req.body;
  const errors: string[] = [];

  if (!repoUrl) {
    errors.push('Repository URL is required');
  } else if (!validateRepoUrl(repoUrl)) {
    errors.push('Invalid GitHub repository URL');
  }

  if (!validateBranch(branch)) {
    errors.push('Invalid branch name');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(', '),
      code: 400,
      timestamp: new Date()
    });
  }

  req.body.repoUrl = sanitizeInput(repoUrl);
  req.body.branch = sanitizeInput(branch);
  next();
};

export const validateDeploymentId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id) || id.length > 50) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid deployment ID',
      code: 400,
      timestamp: new Date()
    });
  }

  next();
};