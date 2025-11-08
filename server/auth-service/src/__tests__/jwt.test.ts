import { generateJWT, verifyJWT, refreshJWT } from '../services/jwt';
import { User } from '../types';

describe('JWT Service', () => {
  const mockUser: User = {
    id: 'test-user-id',
    githubId: 123456,
    username: 'testuser',
    email: 'test@example.com',
    avatarUrl: 'https://github.com/avatar.jpg',
    accessToken: 'encrypted-token',
    createdAt: new Date(),
    lastLogin: new Date()
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key';
  });

  describe('generateJWT', () => {
    it('should generate valid JWT token', () => {
      const token = generateJWT(mockUser);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user data in payload', () => {
      const token = generateJWT(mockUser);
      const payload = verifyJWT(token);
      
      expect(payload).toBeTruthy();
      expect(payload!.userId).toBe(mockUser.id);
      expect(payload!.githubId).toBe(mockUser.githubId);
      expect(payload!.username).toBe(mockUser.username);
    });
  });

  describe('verifyJWT', () => {
    it('should verify valid token', () => {
      const token = generateJWT(mockUser);
      const payload = verifyJWT(token);
      
      expect(payload).toBeTruthy();
      expect(payload!.userId).toBe(mockUser.id);
    });

    it('should reject invalid token', () => {
      const payload = verifyJWT('invalid-token');
      expect(payload).toBeNull();
    });

    it('should reject tampered token', () => {
      const token = generateJWT(mockUser);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const payload = verifyJWT(tamperedToken);
      expect(payload).toBeNull();
    });
  });

  describe('refreshJWT', () => {
    it('should refresh valid token', () => {
      const token = generateJWT(mockUser);
      const newToken = refreshJWT(token);
      
      expect(newToken).toBeTruthy();
      expect(newToken).not.toBe(token);
      
      const payload = verifyJWT(newToken!);
      expect(payload!.userId).toBe(mockUser.id);
    });

    it('should reject invalid token for refresh', () => {
      const newToken = refreshJWT('invalid-token');
      expect(newToken).toBeNull();
    });
  });
});