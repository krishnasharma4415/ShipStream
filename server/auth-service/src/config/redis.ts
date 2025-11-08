import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before creating the client
dotenv.config({ path: path.join(__dirname, '../../../.env') });

console.log('Redis URL configured:', process.env.REDIS_URL ? 'Yes' : 'No');

const redisClient = createClient({
  url: process.env.REDIS_URL
});

let errorLogged = false;
redisClient.on('error', (err) => {
  if (!errorLogged) {
    console.log('Redis connection issue, continuing without Redis');
    errorLogged = true;
  }
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    console.log('Continuing without Redis connection...');
  }
};

export default redisClient;