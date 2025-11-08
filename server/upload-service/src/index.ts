import dotenv from "dotenv";
import path from "path";

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import { random } from "./randomGenerate";
import simpleGit from "simple-git";
import { getAllFiles } from "./getAllfiles";
import { upload } from "./upload";
import { createRedisClient } from "./redisClient";

const app = express();

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Initialize Redis client (only need publisher for upload service)
const redisClient = createRedisClient();

// Connect to Redis
redisClient.connect().catch(console.error);

import { requireAuth, deploymentRateLimit, AuthenticatedRequest } from "./middleware/auth";
import { validateDeployment, validateDeploymentId } from "./middleware/validation";

app.post("/send-url", requireAuth, deploymentRateLimit, validateDeployment, async (req: AuthenticatedRequest, res) => {
  const { repoUrl, branch = 'main' } = req.body;
  const user = req.user!;
  const id = random();
  
  try {
    const git = simpleGit();
    const outputPath = path.join(__dirname, `output/${id}`);
    await git.clone(repoUrl, outputPath, ['--branch', branch]);
    
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'unknown';
    
    const { createDeployment } = await import('./services/deployment');
    const deployment = await createDeployment(id, user.id, repoUrl, repoName, branch);
    
    const files = getAllFiles(outputPath);
    files.forEach(async (element) => {
      const relativePath = element.slice(__dirname.length + 1).replace(/\\/g, '/');
      await upload(element, relativePath);
    });
    
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    redisClient.lPush("build-queue", id);
    redisClient.hSet("status", id, "uploaded");
    
    try {
      const deployServiceUrl = process.env.DEPLOY_SERVICE_URL || "http://localhost:5501";
      const response = await fetch(`${deployServiceUrl}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        console.error(`Failed to trigger deploy service: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error calling deploy service:", error);
    }
    
    res.json({ 
      id: deployment.id,
      subdomain: deployment.subdomain,
      status: deployment.status,
      repoName: deployment.repoName,
      branch: deployment.branch,
      createdAt: deployment.createdAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Deployment Failed',
      message: 'Failed to create deployment',
      code: 500,
      timestamp: new Date()
    });
  }
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const response = await redisClient.hGet("status", id as string);
  res.json({
    status: response,
  });
});

app.get("/deployments", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { getUserDeployments } = await import('./services/deployment');
    const deployments = await getUserDeployments(user.id);
    
    res.json({
      deployments,
      total: deployments.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch deployments',
      code: 500,
      timestamp: new Date()
    });
  }
});

app.get("/deployments/:id", requireAuth, validateDeploymentId, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const deploymentId = req.params.id;
    
    const { getDeployment, checkOwnership } = await import('./services/deployment');
    
    const hasOwnership = await checkOwnership(user.id, deploymentId);
    if (!hasOwnership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this deployment',
        code: 403,
        timestamp: new Date()
      });
    }
    
    const deployment = await getDeployment(deploymentId);
    if (!deployment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Deployment not found',
        code: 404,
        timestamp: new Date()
      });
    }
    
    res.json(deployment);
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch deployment',
      code: 500,
      timestamp: new Date()
    });
  }
});

app.delete("/deployments/:id", requireAuth, validateDeploymentId, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const deploymentId = req.params.id;
    
    const { checkOwnership, deleteDeployment } = await import('./services/deployment');
    
    const hasOwnership = await checkOwnership(user.id, deploymentId);
    if (!hasOwnership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this deployment',
        code: 403,
        timestamp: new Date()
      });
    }
    
    await deleteDeployment(deploymentId);
    
    res.json({
      message: 'Deployment deleted successfully',
      id: deploymentId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete deployment',
      code: 500,
      timestamp: new Date()
    });
  }
});

app.post("/deployments/:id/redeploy", requireAuth, validateDeploymentId, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const deploymentId = req.params.id;
    
    const { checkOwnership, getDeployment, updateDeploymentStatus } = await import('./services/deployment');
    
    const hasOwnership = await checkOwnership(user.id, deploymentId);
    if (!hasOwnership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this deployment',
        code: 403,
        timestamp: new Date()
      });
    }
    
    const deployment = await getDeployment(deploymentId);
    if (!deployment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Deployment not found',
        code: 404,
        timestamp: new Date()
      });
    }
    
    await updateDeploymentStatus(deploymentId, 'uploaded');
    redisClient.lPush("build-queue", deploymentId);
    redisClient.hSet("status", deploymentId, "uploaded");
    
    try {
      const deployServiceUrl = process.env.DEPLOY_SERVICE_URL || "http://localhost:5501";
      await fetch(`${deployServiceUrl}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error calling deploy service:", error);
    }
    
    res.json({
      message: 'Redeployment triggered successfully',
      id: deploymentId,
      status: 'uploaded'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to trigger redeployment',
      code: 500,
      timestamp: new Date()
    });
  }
});

// Health check endpoint for Render.com
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "upload-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.UPLOAD_SERVICE_PORT || 5500;

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`);
});
