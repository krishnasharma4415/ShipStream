import { GitHubOAuthConfig } from '../types';

export const githubConfig: GitHubOAuthConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  redirectUri: process.env.GITHUB_REDIRECT_URI || '',
  scope: ['user:email', 'read:user']
};

export const validateGitHubConfig = (): boolean => {
  return !!(
    githubConfig.clientId &&
    githubConfig.clientSecret &&
    githubConfig.redirectUri
  );
};