import express from "express";
import cors from "cors";
import { random } from "./randomGenerate";
import simpleGit from "simple-git";
import { getAllFiles } from "./getAllfiles";
import path from "path";
import { upload } from "./upload";
import { createRedisClient } from "./redisClient";

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ["http://localhost:5173", "http://localhost:3000"],
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
  publisher.lPush("build-queue", id);
  publisher.hSet("status", id, "uploaded");
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
