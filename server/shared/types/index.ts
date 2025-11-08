export interface User {
  id: string;
  githubId: number;
  username: string;
  email?: string;
  avatarUrl?: string;
  accessToken?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface Deployment {
  id: string;
  userId: string;
  repoUrl: string;
  repoName: string;
  branch: string;
  status: 'uploaded' | 'building' | 'deployed' | 'failed' | 'deleted';
  subdomain: string;
  buildLogs?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  lastDeployedAt?: Date;
  deploymentCount: number;
}

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export interface GitHubUser {
  id: number;
  login: string;
  email?: string;
  avatar_url?: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  code: number;
  timestamp: Date;
}