import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  error: string;
  message: string;
  code: number;
  timestamp: Date;
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const errorResponse: ErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 500,
    timestamp: new Date()
  };

  if (err.name === 'ValidationError') {
    errorResponse.error = 'Validation Error';
    errorResponse.message = err.message;
    errorResponse.code = 400;
  } else if (err.name === 'UnauthorizedError') {
    errorResponse.error = 'Unauthorized';
    errorResponse.message = 'Authentication required';
    errorResponse.code = 401;
  } else if (err.code === 'ENOENT') {
    errorResponse.error = 'File Not Found';
    errorResponse.message = 'Repository or file not found';
    errorResponse.code = 404;
  } else if (err.code === 'ECONNREFUSED') {
    errorResponse.error = 'Service Unavailable';
    errorResponse.message = 'External service unavailable';
    errorResponse.code = 503;
  }

  res.status(errorResponse.code).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse: ErrorResponse = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    code: 404,
    timestamp: new Date()
  };

  res.status(404).json(errorResponse);
};