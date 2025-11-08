import { createRedisClient } from '../redisClient';
import { Deployment } from '../types';

const redisClient = createRedisClient();

export const createDeployment = async (
  id: string,
  userId: string,
  repoUrl: string,
  repoName: string,
  branch: string = 'main'
): Promise<Deployment> => {
  const deployment: Deployment = {
    id,
    userId,
    repoUrl,
    repoName,
    branch,
    status: 'uploaded',
    subdomain: `${id}.deployfast.dev`,
    createdAt: new Date(),
    updatedAt: new Date(),
    deploymentCount: 1
  };

  await redisClient.connect();
  await redisClient.hSet('deployments', id, JSON.stringify(deployment));
  await redisClient.hSet('user_deployments', `${userId}:${id}`, JSON.stringify(deployment));
  await redisClient.disconnect();

  return deployment;
};

export const getDeployment = async (id: string): Promise<Deployment | null> => {
  try {
    await redisClient.connect();
    const deploymentData = await redisClient.hGet('deployments', id);
    await redisClient.disconnect();
    
    return deploymentData ? JSON.parse(deploymentData) : null;
  } catch (error) {
    return null;
  }
};

export const getUserDeployments = async (userId: string): Promise<Deployment[]> => {
  try {
    await redisClient.connect();
    const keys = await redisClient.hKeys('user_deployments');
    const userKeys = keys.filter(key => key.startsWith(`${userId}:`));
    
    const deployments = await Promise.all(
      userKeys.map(async (key) => {
        const data = await redisClient.hGet('user_deployments', key);
        return data ? JSON.parse(data) : null;
      })
    );
    
    await redisClient.disconnect();
    return deployments.filter(d => d && d.status !== 'deleted');
  } catch (error) {
    return [];
  }
};

export const updateDeploymentStatus = async (id: string, status: Deployment['status']): Promise<void> => {
  try {
    await redisClient.connect();
    const deploymentData = await redisClient.hGet('deployments', id);
    
    if (deploymentData) {
      const deployment = JSON.parse(deploymentData);
      deployment.status = status;
      deployment.updatedAt = new Date();
      
      if (status === 'deployed') {
        deployment.deployedAt = new Date();
        deployment.lastDeployedAt = new Date();
      }
      
      await redisClient.hSet('deployments', id, JSON.stringify(deployment));
      await redisClient.hSet('user_deployments', `${deployment.userId}:${id}`, JSON.stringify(deployment));
    }
    
    await redisClient.disconnect();
  } catch (error) {
    console.error('Failed to update deployment status:', error);
  }
};

export const deleteDeployment = async (id: string): Promise<void> => {
  try {
    await redisClient.connect();
    const deploymentData = await redisClient.hGet('deployments', id);
    
    if (deploymentData) {
      const deployment = JSON.parse(deploymentData);
      deployment.status = 'deleted';
      deployment.updatedAt = new Date();
      
      await redisClient.hSet('deployments', id, JSON.stringify(deployment));
      await redisClient.hSet('user_deployments', `${deployment.userId}:${id}`, JSON.stringify(deployment));
    }
    
    await redisClient.disconnect();
  } catch (error) {
    console.error('Failed to delete deployment:', error);
  }
};

export const checkOwnership = async (userId: string, deploymentId: string): Promise<boolean> => {
  try {
    await redisClient.connect();
    const deploymentData = await redisClient.hGet('user_deployments', `${userId}:${deploymentId}`);
    await redisClient.disconnect();
    
    return !!deploymentData;
  } catch (error) {
    return false;
  }
};