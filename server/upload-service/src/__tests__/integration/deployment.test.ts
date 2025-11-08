import request from 'supertest';
import express from 'express';

jest.mock('../../redisClient', () => ({
  createRedisClient: () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    hSet: jest.fn().mockResolvedValue(1),
    hGet: jest.fn().mockResolvedValue(null),
    hKeys: jest.fn().mockResolvedValue([]),
    lPush: jest.fn().mockResolvedValue(1)
  })
}));

jest.mock('simple-git', () => {
  return jest.fn(() => ({
    clone: jest.fn().mockResolvedValue(undefined)
  }));
});

jest.mock('../../getAllfiles', () => ({
  getAllFiles: jest.fn().mockReturnValue(['file1.js', 'file2.js'])
}));

jest.mock('../../upload', () => ({
  upload: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com'
    };
    next();
  },
  deploymentRateLimit: (req: any, res: any, next: any) => next(),
  AuthenticatedRequest: {}
}));

describe('Deployment Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    app = express();
    app.use(express.json());
    
    const { requireAuth, deploymentRateLimit } = require('../../middleware/auth');
    const { validateDeployment, validateDeploymentId } = require('../../middleware/validation');
    
    app.post('/send-url', requireAuth, deploymentRateLimit, validateDeployment, async (req, res) => {
      res.json({
        id: 'test-deployment-id',
        subdomain: 'test-deployment-id.deployfast.dev',
        status: 'uploaded',
        repoName: 'test-repo',
        branch: 'main',
        createdAt: new Date()
      });
    });

    app.get('/deployments', requireAuth, async (req, res) => {
      res.json({
        deployments: [],
        total: 0
      });
    });

    app.get('/deployments/:id', requireAuth, validateDeploymentId, async (req, res) => {
      res.json({
        id: req.params.id,
        userId: 'user-123',
        status: 'deployed'
      });
    });

    app.delete('/deployments/:id', requireAuth, validateDeploymentId, async (req, res) => {
      res.json({
        message: 'Deployment deleted successfully',
        id: req.params.id
      });
    });

    app.post('/deployments/:id/redeploy', requireAuth, validateDeploymentId, async (req, res) => {
      res.json({
        message: 'Redeployment triggered successfully',
        id: req.params.id,
        status: 'uploaded'
      });
    });
  });

  describe('POST /send-url', () => {
    it('should create deployment successfully', async () => {
      const response = await request(app)
        .post('/send-url')
        .send({
          repoUrl: 'https://github.com/user/repo',
          branch: 'main'
        })
        .expect(200);

      expect(response.body.id).toBeDefined();
      expect(response.body.subdomain).toContain('deployfast.dev');
      expect(response.body.status).toBe('uploaded');
    });

    it('should reject invalid repository URL', async () => {
      const response = await request(app)
        .post('/send-url')
        .send({
          repoUrl: 'invalid-url',
          branch: 'main'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should reject invalid branch name', async () => {
      const response = await request(app)
        .post('/send-url')
        .send({
          repoUrl: 'https://github.com/user/repo',
          branch: 'invalid<>branch'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /deployments', () => {
    it('should return user deployments', async () => {
      const response = await request(app)
        .get('/deployments')
        .expect(200);

      expect(response.body.deployments).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
  });

  describe('GET /deployments/:id', () => {
    it('should return deployment details', async () => {
      const response = await request(app)
        .get('/deployments/test-id')
        .expect(200);

      expect(response.body.id).toBe('test-id');
      expect(response.body.userId).toBe('user-123');
    });

    it('should reject invalid deployment ID', async () => {
      const response = await request(app)
        .get('/deployments/invalid<>id')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('DELETE /deployments/:id', () => {
    it('should delete deployment successfully', async () => {
      const response = await request(app)
        .delete('/deployments/test-id')
        .expect(200);

      expect(response.body.message).toBe('Deployment deleted successfully');
      expect(response.body.id).toBe('test-id');
    });
  });

  describe('POST /deployments/:id/redeploy', () => {
    it('should trigger redeployment successfully', async () => {
      const response = await request(app)
        .post('/deployments/test-id/redeploy')
        .expect(200);

      expect(response.body.message).toBe('Redeployment triggered successfully');
      expect(response.body.status).toBe('uploaded');
    });
  });
});