import jwt from 'jsonwebtoken';
import { JWTPayload, User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRY = '24h';

export const generateJWT = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    githubId: user.githubId,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const refreshJWT = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as JWTPayload;
    
    const newPayload: JWTPayload = {
      userId: decoded.userId,
      githubId: decoded.githubId,
      username: decoded.username,
      email: decoded.email,
      avatarUrl: decoded.avatarUrl,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  } catch (error) {
    return null;
  }
};