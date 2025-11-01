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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from server/.env
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const randomGenerate_1 = require("./randomGenerate");
const simple_git_1 = __importDefault(require("simple-git"));
const getAllfiles_1 = require("./getAllfiles");
const upload_1 = require("./upload");
const redisClient_1 = require("./redisClient");
const app = (0, express_1.default)();
// CORS configuration - Allow multiple origins
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
// Initialize Redis clients
const publisher = (0, redisClient_1.createRedisClient)();
const subscriber = (0, redisClient_1.createRedisClient)();
// Connect to Redis
publisher.connect().catch(console.error);
subscriber.connect().catch(console.error);
app.post("/send-url", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoUrl = req.body.repoUrl;
    const id = (0, randomGenerate_1.random)();
    const git = (0, simple_git_1.default)();
    const outputPath = path_1.default.join(__dirname, `output/${id}`);
    yield git.clone(repoUrl, outputPath);
    const files = (0, getAllfiles_1.getAllFiles)(outputPath);
    files.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, upload_1.upload)(element, element.slice(__dirname.length + 1));
    }));
    yield new Promise((resolve) => setTimeout(resolve, 5000));
    // Queue the job in Redis
    publisher.lPush("build-queue", id);
    publisher.hSet("status", id, "uploaded");
    // Trigger the deploy service
    try {
        const deployServiceUrl = process.env.DEPLOY_SERVICE_URL || "http://localhost:5501";
        const response = yield fetch(`${deployServiceUrl}/deploy`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            console.error(`Failed to trigger deploy service: ${response.status} ${response.statusText}`);
        }
        else {
            console.log(`Successfully triggered deploy service for ID: ${id}`);
        }
    }
    catch (error) {
        console.error("Error calling deploy service:", error);
    }
    res.json({ generated: id, files });
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    const response = yield subscriber.hGet("status", id);
    res.json({
        status: response,
    });
}));
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
