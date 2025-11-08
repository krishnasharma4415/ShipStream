import { Request, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

jest.mock('../services/jwt');
jest.mock('../services/user');

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('requireAuth', () => {
    it('should reject request without authorization header', async () => {
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization header', async () => {
      mockReq.headers!.authorization = 'Invalid token';
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should process valid authorization header', async () => {
      const { verifyJWT } = require('../services/jwt');
      const { getUserById } = require('../services/user');
      
      verifyJWT.mockReturnValue({ userId: 'test-user-id' });
      getUserById.mockResolvedValue({ id: 'test-user-id', username: 'test' });
      
      mockReq.headers!.authorization = 'Bearer valid-token';
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      const { verifyJWT } = require('../services/jwt');
      verifyJWT.mockReturnValue(null);
      
      mockReq.headers!.authorization = 'Bearer invalid-token';
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when user not found', async () => {
      const { verifyJWT } = require('../services/jwt');
      const { getUserById } = require('../services/user');
      
      verifyJWT.mockReturnValue({ userId: 'test-user-id' });
      getUserById.mockResolvedValue(null);
      
      mockReq.headers!.authorization = 'Bearer valid-token';
      
      await requireAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});