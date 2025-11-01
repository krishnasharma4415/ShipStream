"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_s3_1 = require("@aws-sdk/client-s3");
const r2Client_1 = require("./r2Client");
const app = (0, express_1.default)();
// Health check endpoint for Render.com
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "request-handler",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.get("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
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
        const command = new client_s3_1.GetObjectCommand({
            Bucket: r2Client_1.BUCKET_NAME,
            Key: key,
        });
        const response = yield r2Client_1.r2Client.send(command);
        if (response.Body) {
            const chunks = [];
            const stream = response.Body;
            try {
                for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                    _c = stream_1_1.value;
                    _d = false;
                    const chunk = _c;
                    chunks.push(chunk);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
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
        }
        else {
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
    }
    catch (error) {
        // Only log non-404 errors to reduce noise
        if (error.name !== 'NoSuchKey') {
            console.error("Error serving file:", error);
        }
        else {
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
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Request handler running on port ${PORT}`);
});
