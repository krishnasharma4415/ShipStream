import { generateAuthUrl, validateState } from '../services/oauth';

jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1)
  }
}));

describe('OAuth Service', () => {
  beforeAll(() => {
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_REDIRECT_URI = 'http://localhost:5501/auth/github/callback';
  });

  describe('generateAuthUrl', () => {
    it('should generate GitHub authorization URL with state', async () => {
      const result = await generateAuthUrl();
      
      expect(result.url).toContain('https://github.com/login/oauth/authorize');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('redirect_uri=');
      expect(result.url).toContain(`state=${result.state}`);
      expect(result.state).toHaveLength(32);
    });

    it('should include required OAuth parameters', async () => {
      const result = await generateAuthUrl();
      const url = new URL(result.url);
      
      expect(url.searchParams.get('client_id')).toBe('test-client-id');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toContain('user:email');
      expect(url.searchParams.get('state')).toBe(result.state);
    });
  });

  describe('validateState', () => {
    const mockRedis = require('../config/redis').default;

    it('should validate correct state', async () => {
      mockRedis.get.mockResolvedValueOnce('valid');
      
      const isValid = await validateState('test-state');
      expect(isValid).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('oauth_state:test-state');
    });

    it('should reject invalid state', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      
      const isValid = await validateState('invalid-state');
      expect(isValid).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));
      
      const isValid = await validateState('test-state');
      expect(isValid).toBe(false);
    });
  });
});