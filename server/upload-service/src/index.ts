import express from "express";
import cors from "cors";
import { random } from "./randomGenerate";
import simpleGit from "simple-git";
import { getAllFiles } from "./getAllfiles";
import path from "path";
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

// Initialize Redis clients
const publisher = createRedisClient();
const subscriber = createRedisClient();

// Connect to Redis
publisher.connect().catch(console.error);
subscriber.connect().catch(console.error);

app.post("/send-url", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  const id = random();
  const git = simpleGit();
  const outputPath = path.join(__dirname, `output/${id}`);
  await git.clone(repoUrl, outputPath);
  const files = getAllFiles(outputPath);
  files.forEach(async (element) => {
    await upload(element, element.slice(__dirname.length + 1));
  });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  
  // Queue the job in Redis
  publisher.lPush("build-queue", id);
  publisher.hSet("status", id, "uploaded");
  
  // Trigger the deploy service
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
    } else {
      console.log(`Successfully triggered deploy service for ID: ${id}`);
    }
  } catch (error) {
    console.error("Error calling deploy service:", error);
  }
  
  res.json({ generated: id, files });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const response = await subscriber.hGet("status", id as string);
  res.json({
    status: response,
  });
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

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`);
});
