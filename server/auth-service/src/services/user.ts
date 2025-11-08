import { v4 as uuidv4 } from 'uuid';
import { User, GitHubUser } from '../types';
import { encrypt } from '../utils/encryption';
import { sanitizeUserData, validateGitHubUser } from '../utils/validation';
import { setItem, getItem } from './memory-store';

export const createOrUpdateUser = async (githubUser: GitHubUser, accessToken: string): Promise<User> => {
  if (!validateGitHubUser(githubUser)) {
    throw new Error('Invalid GitHub user data');
  }

  const existingUserData = await getItem(`user:github:${githubUser.id}`);
  
  let user: User;
  
  if (existingUserData) {
    user = JSON.parse(existingUserData);
    user.lastLogin = new Date();
    user.accessToken = encrypt(accessToken);
    user.email = githubUser.email || user.email;
    user.avatarUrl = githubUser.avatar_url;
  } else {
    const sanitizedData = sanitizeUserData(githubUser);
    user = {
      id: uuidv4(),
      githubId: sanitizedData.githubId!,
      username: sanitizedData.username!,
      email: sanitizedData.email!,
      avatarUrl: sanitizedData.avatarUrl!,
      accessToken: encrypt(accessToken),
      createdAt: new Date(),
      lastLogin: new Date()
    };
  }

  await Promise.all([
    setItem(`user:${user.id}`, JSON.stringify(user)),
    setItem(`user:github:${user.githubId}`, JSON.stringify(user))
  ]);

  return user;
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userData = await getItem(`user:${userId}`);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

export const getUserByGitHubId = async (githubId: number): Promise<User | null> => {
  try {
    const userData = await getItem(`user:github:${githubId}`);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};