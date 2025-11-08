import { encrypt, decrypt, hashPassword, generateSecureToken } from '../utils/encryption';

describe('Encryption Utils', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-key-32-characters-long-123';
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'sensitive-data-123';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(encrypted).not.toBe(originalText);
      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted values for same input', () => {
      const text = 'same-input';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => decrypt('invalid-data')).toThrow('Decryption failed');
    });
  });

  describe('hashPassword', () => {
    it('should hash password consistently', () => {
      const password = 'test-password';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(password);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure token of correct length', () => {
      const token = generateSecureToken(16);
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });
});