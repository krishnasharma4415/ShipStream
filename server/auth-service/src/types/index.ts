export interface User {
  id: string;
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessed: Date;
}

export interface JWTPayload {
  userId: string;
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
  iat: number;
  exp?: number;
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  code: number;
  timestamp: Date;
}

export interface GitHubUser {
  id: number;
  login: string;
  email: string;
  avatar_url: string;
  name: string;
}