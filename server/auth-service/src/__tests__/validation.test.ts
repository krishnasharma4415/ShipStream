import { validateEmail, validateUsername, validateGitHubUser, sanitizeUserData, validateJWTPayload } from '../utils/validation';
import { GitHubUser } from '../types';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should validate correct username', () => {
      expect(validateUsername('testuser')).toBe(true);
    });

    it('should reject invalid username', () => {
      expect(validateUsername('')).toBe(false);
      expect(validateUsername('a'.repeat(40))).toBe(false);
    });
  });

  describe('validateGitHubUser', () => {
    const validGitHubUser: GitHubUser = {
      id: 123,
      login: 'testuser',
      email: 'test@example.com',
      avatar_url: 'https://github.com/avatar.jpg',
      name: 'Test User'
    };

    it('should validate correct GitHub user', () => {
      expect(validateGitHubUser(validGitHubUser)).toBe(true);
    });

    it('should reject invalid GitHub user', () => {
      expect(validateGitHubUser({ ...validGitHubUser, id: 0 })).toBe(false);
      expect(validateGitHubUser({ ...validGitHubUser, login: '' })).toBe(false);
    });
  });

  describe('sanitizeUserData', () => {
    it('should sanitize GitHub user data', () => {
      const githubUser: GitHubUser = {
        id: 123,
        login: '  testuser  ',
        email: 'test@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        name: 'Test User'
      };

      const result = sanitizeUserData(githubUser);
      expect(result.username).toBe('testuser');
      expect(result.githubId).toBe(123);
    });
  });

  describe('validateJWTPayload', () => {
    it('should validate correct JWT payload', () => {
      const payload = {
        userId: '123',
        githubId: 456,
        username: 'test',
        exp: Date.now(),
        iat: Date.now()
      };
      expect(validateJWTPayload(payload)).toBe(true);
    });

    it('should reject invalid JWT payload', () => {
      expect(validateJWTPayload({})).toBe(false);
      expect(validateJWTPayload({ userId: '123' })).toBe(false);
    });
  });
});