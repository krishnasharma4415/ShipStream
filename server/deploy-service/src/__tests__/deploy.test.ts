import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../r2Storage', () => ({
  downloadR2Folder: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  copyFinalDist: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
}));

jest.mock('../execute', () => ({
  buildProject: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
}));

jest.mock('../redisClient', () => ({
  createRedisClient: () => ({
    connect: jest.fn(),
    brPop: jest.fn(),
    hSet: jest.fn(),
    disconnect: jest.fn()
  })
}));

describe('Deploy Service', () => {
  let app: express.Application;
  let mockRedis: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock Redis client
    const { createRedisClient } = require('../redisClient');
    mockRedis = createRedisClient();
    
    // Import the app after mocks are set up
    const deployApp = require('../index');
  });

  describe('POST /deploy', () => {
    it('should process deployment queue successfully', async () => {
      // Mock Redis to return a deployment ID
      mockRedis.brPop.mockResolvedValueOnce({
        element: 'test-deployment-id'
      });
      
      // Mock subsequent calls to return null (empty queue)
      mockRedis.brPop.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/deploy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('processed successfully');
    });

    it('should handle empty queue', async () => {
      // Mock Redis to return null immediately (empty queue)
      mockRedis.brPop.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/deploy')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle deployment processing errors', async () => {
      // Mock Redis to return a deployment ID
      mockRedis.brPop.mockResolvedValueOnce({
        element: 'test-deployment-id'
      });

      // Mock build to fail
      const { buildProject } = require('../execute');
      buildProject.mockRejectedValueOnce(new Error('Build failed'));

      const response = await request(app)
        .post('/deploy')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to process');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('deploy-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Queue Processing', () => {
    it('should process multiple deployments in sequence', async () => {
      const deploymentIds = ['deploy-1', 'deploy-2', 'deploy-3'];
      
      // Mock Redis to return deployments in sequence, then null
      mockRedis.brPop
        .mockResolvedValueOnce({ element: deploymentIds[0] })
        .mockResolvedValueOnce({ element: deploymentIds[1] })
        .mockResolvedValueOnce({ element: deploymentIds[2] })
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/deploy')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify all deployments were processed
      const { downloadR2Folder } = require('../r2Storage');
      const { buildProject } = require('../execute');
      const { copyFinalDist } = require('../r2Storage');
      
      expect(downloadR2Folder).toHaveBeenCalledTimes(3);
      expect(buildProject).toHaveBeenCalledTimes(3);
      expect(copyFinalDist).toHaveBeenCalledTimes(3);
      
      deploymentIds.forEach(id => {
        expect(buildProject).toHaveBeenCalledWith(id);
        expect(copyFinalDist).toHaveBeenCalledWith(id);
      });
    });

    it('should update deployment status after successful build', async () => {
      mockRedis.brPop
        .mockResolvedValueOnce({ element: 'test-deployment' })
        .mockResolvedValueOnce(null);

      await request(app)
        .post('/deploy')
        .expect(200);

      expect(mockRedis.hSet).toHaveBeenCalledWith('status', 'test-deployment', 'deployed');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedis.brPop.mockRejectedValueOnce(new Error('Redis connection failed'));

      const response = await request(app)
        .post('/deploy')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Redis connection failed');
    });

    it('should handle R2 download errors', async () => {
      mockRedis.brPop
        .mockResolvedValueOnce({ element: 'test-deployment' })
        .mockResolvedValueOnce(null);

      const { downloadR2Folder } = require('../r2Storage');
      downloadR2Folder.mockRejectedValueOnce(new Error('R2 download failed'));

      const response = await request(app)
        .post('/deploy')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle build failures gracefully', async () => {
      mockRedis.brPop
        .mockResolvedValueOnce({ element: 'test-deployment' })
        .mockResolvedValueOnce(null);

      const { buildProject } = require('../execute');
      buildProject.mockRejectedValueOnce(new Error('npm install failed'));

      const response = await request(app)
        .post('/deploy')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});