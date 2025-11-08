export interface User {
  id: string;
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  lastLogin: string;
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
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
  lastDeployedAt?: string;
  deploymentCount: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}