import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectRedis } from './config/redis';
import authRoutes from './routes/auth';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 5501;

app.use(helmet());

// Allow multiple origins for CORS (production and local development)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.use('/auth', authRoutes);

import { errorHandler, notFoundHandler } from './middleware/errorHandler';

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();