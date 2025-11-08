import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../r2Client', () => ({
  r2Client: {
    send: jest.fn()
  },
  BUCKET_NAME: 'test-bucket'
}));

jest.mock('../redisClient', () => ({
  createRedisClient: () => ({
    connect: jest.fn(),
    lPush: jest.fn(),
    hSet: jest.fn(),
    hGet: jest.fn(),
    disconnect: jest.fn()
  })
}));

jest.mock('simple-git', () => {
  return jest.fn(() => ({
    clone: jest.fn().mockResolvedValue(undefined)
  }));
});

jest.mock('../getAllfiles', () => ({
  getAllFiles: jest.fn().mockReturnValue(['/test/file1.js', '/test/file2.html'])
}));

jest.mock('../upload', () => ({
  upload: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../services/deployment', () => ({
  createDeployment: jest.fn().mockResolvedValue({
    id: 'test-id',
    subdomain: 'test-id.deployfast.dev',
    status: 'uploaded',
    repoName: 'test-repo',
    branch: 'main',
    createdAt: new Date()
  }),
  getUserDeployments: jest.fn().mockResolvedValue([]),
  getDeployment: jest.fn().mockResolvedValue(null),
  checkOwnership: jest.fn().mockResolvedValue(true),
  deleteDeployment: jest.fn().mockResolvedValue(undefined),
  updateDeploymentStatus: jest.fn().mockResolvedValue(undefined)
}));

// Mock auth middleware
const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com'
};

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
  deploymentRateLimit: (req: any, res: any, next: any) => next(),
  AuthenticatedRequest: class {}
}));

jest.mock('../middleware/validation', () => ({
  validateDeployment: (req: any, res: any, next: any) => next(),
  validateDeploymentId: (req: any, res: any, next: any) => next()
}));

describe('Upload Service', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Import routes after mocks are set up
    const routes = require('../index');
  });

  describe('POST /send-url', () => {
    it('should create a new deployment', async () => {
      const response = await request(app)
        .post('/send-url')
        .send({
          repoUrl: 'https://github.com/user/repo.git',
          branch: 'main'
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('subdomain');
      expect(response.body.status).toBe('uploaded');
    });

    it('should reject invalid repository URLs', async () => {
      await request(app)
        .post('/send-url')
        .send({
          repoUrl: 'invalid-url',
          branch: 'main'
        })
        .expect(400);
    });

    it('should use main branch as default', async () => {
      const response = await request(app)
        .post('/send-url')
        .send({
          repoUrl: 'https://github.com/user/repo.git'
        })
        .expect(200);

      expect(response.body.branch).toBe('main');
    });
  });

  describe('GET /deployments', () => {
    it('should return user deployments', async () => {
      const response = await request(app)
        .get('/deployments')
        .expect(200);

      expect(response.body).toHaveProperty('deployments');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.deployments)).toBe(true);
    });
  });

  describe('GET /deployments/:id', () => {
    it('should return deployment details for owner', async () => {
      const deploymentId = 'test-deployment-id';
      
      // Mock the deployment service to return a deployment
      const { getDeployment } = require('../services/deployment');
      getDeployment.mockResolvedValueOnce({
        id: deploymentId,
        userId: mockUser.id,
        repoUrl: 'https://github.com/user/repo.git',
        status: 'deployed'
      });

      const response = await request(app)
        .get(`/deployments/${deploymentId}`)
        .expect(200);

      expect(response.body.id).toBe(deploymentId);
    });

    it('should return 403 for non-owner', async () => {
      const { checkOwnership } = require('../services/deployment');
      checkOwnership.mockResolvedValueOnce(false);

      await request(app)
        .get('/deployments/other-user-deployment')
        .expect(403);
    });
  });

  describe('DELETE /deployments/:id', () => {
    it('should delete deployment for owner', async () => {
      const deploymentId = 'test-deployment-id';

      const response = await request(app)
        .delete(`/deployments/${deploymentId}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');
      expect(response.body.id).toBe(deploymentId);
    });
  });

  describe('POST /deployments/:id/redeploy', () => {
    it('should trigger redeployment for owner', async () => {
      const deploymentId = 'test-deployment-id';
      
      const { getDeployment } = require('../services/deployment');
      getDeployment.mockResolvedValueOnce({
        id: deploymentId,
        userId: mockUser.id,
        status: 'deployed'
      });

      const response = await request(app)
        .post(`/deployments/${deploymentId}/redeploy`)
        .expect(200);

      expect(response.body.message).toContain('triggered successfully');
      expect(response.body.status).toBe('uploaded');
    });
  });

  describe('GET /status', () => {
    it('should return deployment status', async () => {
      const { createRedisClient } = require('../redisClient');
      const mockRedis = createRedisClient();
      mockRedis.hGet.mockResolvedValueOnce('deployed');

      const response = await request(app)
        .get('/status?id=test-id')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('upload-service');
    });
  });
});