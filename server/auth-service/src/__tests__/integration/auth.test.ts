import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';

jest.mock('../../config/redis', () => ({
  __esModule: true,
  default: {
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    set: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  },
  connectRedis: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../services/github', () => ({
  exchangeCodeForToken: jest.fn(),
  fetchGitHubUser: jest.fn()
}));

jest.mock('../../services/user', () => ({
  createOrUpdateUser: jest.fn(),
  getUserById: jest.fn()
}));

jest.mock('../../services/session', () => ({
  createSession: jest.fn(),
  deleteSession: jest.fn()
}));

jest.mock('../../services/jwt', () => ({
  generateJWT: jest.fn(),
  verifyJWT: jest.fn(),
  refreshJWT: jest.fn()
}));

describe('Auth Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
    process.env.GITHUB_REDIRECT_URI = 'http://localhost:5501/auth/github/callback';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.ENCRYPTION_KEY = 'test-key-32-characters-long-123';

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/github/login', () => {
    it('should initiate GitHub OAuth flow', async () => {
      const response = await request(app)
        .post('/auth/github/login')
        .expect(200);

      expect(response.body.authUrl).toContain('https://github.com/login/oauth/authorize');
      expect(response.body.state).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      for (let i = 0; i < 6; i++) {
        await request(app).post('/auth/github/login');
      }

      const response = await request(app)
        .post('/auth/github/login')
        .expect(429);

      expect(response.body.error).toBe('Rate Limit Exceeded');
    });
  });

  describe('GET /auth/github/callback', () => {
    beforeEach(() => {
      const mockRedis = require('../../config/redis').default;
      mockRedis.get.mockResolvedValue('valid');

      const { exchangeCodeForToken, fetchGitHubUser } = require('../../services/github');
      const { createOrUpdateUser } = require('../../services/user');
      const { createSession } = require('../../services/session');
      const { generateJWT } = require('../../services/jwt');

      exchangeCodeForToken.mockResolvedValue('mock-access-token');
      fetchGitHubUser.mockResolvedValue({
        id: 123,
        login: 'testuser',
        email: 'test@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        name: 'Test User'
      });
      createOrUpdateUser.mockResolvedValue({
        id: 'user-123',
        githubId: 123,
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://github.com/avatar.jpg'
      });
      createSession.mockResolvedValue({
        sessionId: 'session-123',
        userId: 'user-123'
      });
      generateJWT.mockReturnValue('mock-jwt-token');
    });

    it('should handle OAuth callback successfully', async () => {
      const response = await request(app)
        .get('/auth/github/callback?code=test-code&state=test-state')
        .expect(302);

      expect(response.headers.location).toContain('token=mock-jwt-token');
      expect(response.headers.location).toContain('sessionId=session-123');
    });

    it('should reject callback without code', async () => {
      const response = await request(app)
        .get('/auth/github/callback?state=test-state')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should reject callback with invalid state', async () => {
      const mockRedis = require('../../config/redis').default;
      mockRedis.get.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/auth/github/callback?code=test-code&state=invalid-state')
        .expect(400);

      expect(response.body.error).toBe('Invalid State');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info with valid token', async () => {
      const { verifyJWT } = require('../../services/jwt');
      const { getUserById } = require('../../services/user');

      verifyJWT.mockReturnValue({ userId: 'user-123' });
      getUserById.mockResolvedValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com'
      });

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.username).toBe('testuser');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ sessionId: 'session-123' })
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should reject logout without session ID', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});