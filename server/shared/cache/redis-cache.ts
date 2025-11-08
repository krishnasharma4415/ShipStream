import { createClient, RedisClientType } from 'redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('redis-cache');

export class RedisCache {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor(redisUrl?: string) {
    this.client = createClient({
      url: redisUrl || process.env.REDIS_URL
    });

    this.client.on('error', (err) => {
      logger.error('Redis cache error', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis cache connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis cache disconnected');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
    }
  }

  // Basic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', error as Error, { key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error', error as Error, { key });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', error as Error, { key });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', error as Error, { key });
      return false;
    }
  }

  // Cache with automatic refresh
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttlSeconds: number = 3600
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch and store
      const fresh = await fetchFunction();
      await this.set(key, fresh, ttlSeconds);
      return fresh;
    } catch (error) {
      logger.error('Cache getOrSet error', error as Error, { key });
      return null;
    }
  }

  // Deployment-specific cache methods
  async cacheDeploymentStatus(deploymentId: string, status: string, ttl: number = 300): Promise<void> {
    await this.set(`deployment:status:${deploymentId}`, status, ttl);
  }

  async getDeploymentStatus(deploymentId: string): Promise<string | null> {
    return await this.get(`deployment:status:${deploymentId}`);
  }

  async cacheUserDeployments(userId: string, deployments: any[], ttl: number = 600): Promise<void> {
    await this.set(`user:deployments:${userId}`, deployments, ttl);
  }

  async getUserDeployments(userId: string): Promise<any[] | null> {
    return await this.get(`user:deployments:${userId}`);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `user:*:${userId}`;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Cache invalidation error', error as Error, { userId, pattern });
    }
  }

  // Build cache for faster deployments
  async cacheBuildArtifacts(repoUrl: string, branch: string, artifacts: string[], ttl: number = 86400): Promise<void> {
    const key = `build:${Buffer.from(`${repoUrl}:${branch}`).toString('base64')}`;
    await this.set(key, artifacts, ttl);
  }

  async getBuildArtifacts(repoUrl: string, branch: string): Promise<string[] | null> {
    const key = `build:${Buffer.from(`${repoUrl}:${branch}`).toString('base64')}`;
    return await this.get(key);
  }

  // Rate limiting cache
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return current;
    } catch (error) {
      logger.error('Rate limit increment error', error as Error, { key });
      return 0;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed', error as Error);
      return false;
    }
  }

  // Bulk operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Cache mget error', error as Error, {