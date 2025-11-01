import express from "express";
import { commandOptions } from "redis";
import { copyFinalDist, downloadR2Folder } from "./r2Storage";
import { buildProject } from "./execute";
import { createRedisClient } from "./redisClient";

const app = express();
app.use(express.json());

// Initialize Redis clients
const subscriber = createRedisClient();
const publisher = createRedisClient();

// Connect to Redis
subscriber.connect().catch(console.error);
publisher.connect().catch(console.error);

async function processQueue() {
  try {
    while (true) {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        "build-queue",
        1 // 1 second timeout instead of blocking indefinitely
      );

      if (response) {
        const id = response.element[1];
        console.log(`Processing deployment for ID: ${id}`);
        
        await downloadR2Folder(`output${id}`);
        await buildProject(id);
        copyFinalDist(id);
        publisher.hSet("status", id, "deployed");
        
        console.log(`Deployment completed for ID: ${id}`);
      } else {
        // No more items in queue, break the loop
        break;
      }
    }
  } catch (error) {
    console.error("Error processing queue:", error);
    throw error;
  }
}

// Endpoint to trigger deployment processing
app.post("/deploy", async (req, res) => {
  try {
    console.log("Deploy endpoint triggered, processing queue...");
    await processQueue();
    res.json({ 
      success: true, 
      message: "Queue processed successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in deploy endpoint:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process deployment queue",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "deploy-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 5501;

app.listen(PORT, () => {
  console.log(`Deploy service running on port ${PORT}`);
});
