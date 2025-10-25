import { createClient } from "redis";

// Create Redis clients for Upstash
export const createRedisClient = () => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('Redis Client Connected');
  });

  return client;
};