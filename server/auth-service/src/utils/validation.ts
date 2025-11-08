import { User, GitHubUser } from '../types';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): boolean => {
  return !!(username && username.length >= 1 && username.length <= 39);
};

export const validateGitHubUser = (githubUser: GitHubUser): boolean => {
  return !!(
    githubUser.id &&
    githubUser.login &&
    validateUsername(githubUser.login) &&
    githubUser.avatar_url
  );
};

export const sanitizeUserData = (githubUser: GitHubUser): Partial<User> => {
  return {
    githubId: githubUser.id,
    username: githubUser.login.trim(),
    email: githubUser.email || '',
    avatarUrl: githubUser.avatar_url
  };
};

export const validateJWTPayload = (payload: any): boolean => {
  return !!(
    payload.userId &&
    payload.githubId &&
    payload.username &&
    payload.exp &&
    payload.iat
  );
};