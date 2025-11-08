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

export interface JWTPayload {
  userId: string;
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
  iat: number;
  exp: number;
}

export interface Deployment {
  id: string;
  userId: string;
  repoUrl: string;
  repoName: string;
  branch: string;
  status: 'uploaded' | 'building' | 'deployed' | 'failed' | 'deleted';
  subdomain: string;
  customDomain?: string;
  buildTime?: number;
  buildLogs?: string;
  errorLogs?: string;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  lastDeployedAt?: Date;
  deploymentCount: number;
}