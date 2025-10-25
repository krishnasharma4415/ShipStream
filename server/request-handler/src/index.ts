import express from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_NAME } from "./r2Client";

const app = express();

// Health check endpoint for Render.com
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "request-handler",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("*", async (req, res) => {
  try {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path;
    
    // Default to index.html if path is root
    const key = `dist/${id}${filePath === "/" ? "/index.html" : filePath}`;
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    
    if (response.Body) {
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const fileContent = Buffer.concat(chunks);

      const type = filePath.endsWith(".html") || filePath === "/"
        ? "text/html"
        : filePath.endsWith(".css")
        ? "text/css"
        : filePath.endsWith(".js")
        ? "application/javascript"
        : filePath.endsWith(".json")
        ? "application/json"
        : "text/plain";
      
      res.set("Content-Type", type);
      res.send(fileContent);
    } else {
      res.status(404).send("File not found");
    }
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(404).send("File not found");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Request handler running on port ${PORT}`);
});
