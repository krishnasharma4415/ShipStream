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
  const host = req.hostname;
  const id = host.split(".")[0];
  const filePath = req.path;
  
  // Handle direct access to request-handler service
  if (host.includes('request-handler') && host.includes('onrender.com')) {
    return res.send(`
      <html>
        <head><title>ShipStream Request Handler</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>🚢 ShipStream Request Handler</h1>
          <p>This is the request handler service for ShipStream deployments.</p>
          
          <h2>How it works:</h2>
          <ul>
            <li>Deploy applications using the upload service</li>
            <li>Access deployed apps via subdomain: <code>{deployment-id}.yourdomain.com</code></li>
            <li>This service serves the built files from Cloudflare R2</li>
          </ul>
          
          <h2>Service Status:</h2>
          <p>✅ Request Handler is running and healthy</p>
          <p>🔗 <a href="/health">Health Check</a></p>
          
          <h2>Example Usage:</h2>
          <p>After deploying an app with ID <code>abc123</code>, access it at:</p>
          <code>http://abc123.localhost:3000</code> (local)<br>
          <code>http://abc123.yourdomain.com</code> (production)
          
          <hr style="margin: 30px 0;">
          <p><small>ShipStream - Deploy any GitHub repository instantly</small></p>
        </body>
      </html>
    `);
  }
  
  try {
    // Skip favicon requests to reduce noise
    if (filePath === "/favicon.ico") {
      return res.status(404).send("Not found");
    }
    
    // Default to index.html if path is root
    const key = `dist/${id}${filePath === "/" ? "/index.html" : filePath}`;
    
    console.log(`Serving: ${key} for host: ${host}`);
    
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
        : filePath.endsWith(".png")
        ? "image/png"
        : filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")
        ? "image/jpeg"
        : filePath.endsWith(".svg")
        ? "image/svg+xml"
        : "text/plain";
      
      res.set("Content-Type", type);
      res.send(fileContent);
    } else {
      res.status(404).send(`
        <html>
          <head><title>Deployment Not Found</title></head>
          <body>
            <h1>🚢 Deployment Not Found</h1>
            <p>The deployment <strong>${id}</strong> was not found or is still being built.</p>
            <p>Please check:</p>
            <ul>
              <li>The deployment ID is correct</li>
              <li>The deployment has completed successfully</li>
              <li>The build process finished without errors</li>
            </ul>
            <p><a href="/">← Back to ShipStream</a></p>
          </body>
        </html>
      `);
    }
  } catch (error: any) {
    // Only log non-404 errors to reduce noise
    if (error.name !== 'NoSuchKey') {
      console.error("Error serving file:", error);
    } else {
      console.log(`File not found: dist/${id}${req.path}`);
    }
    
    res.status(404).send(`
      <html>
        <head><title>File Not Found</title></head>
        <body>
          <h1>🚢 File Not Found</h1>
          <p>The requested file could not be found in deployment <strong>${id}</strong>.</p>
          <p>This could mean:</p>
          <ul>
            <li>The deployment is still in progress</li>
            <li>The file doesn't exist in the built application</li>
            <li>The deployment failed during the build process</li>
          </ul>
          <p><a href="/">← Back to ShipStream</a></p>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Request handler running on port ${PORT}`);
});
