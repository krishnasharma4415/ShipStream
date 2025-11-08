"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// Initialize Redis client (only need publisher for upload service)
const redisClient = (0, redisClient_1.createRedisClient)();
// Connect to Redis
redisClient.connect().catch(console.error);
const auth_1 = require("./middleware/auth");
const validation_1 = require("./middleware/validation");
app.post("/send-url", auth_1.requireAuth, auth_1.deploymentRateLimit, validation_1.validateDeployment, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { repoUrl, branch = 'main' } = req.body;
    const user = req.user;
    const id = (0, randomGenerate_1.random)();
    try {
        const git = (0, simple_git_1.default)();
        const outputPath = path_1.default.join(__dirname, `output/${id}`);
        yield git.clone(repoUrl, outputPath, ['--branch', branch]);
        const repoName = ((_a = repoUrl.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.git', '')) || 'unknown';
        const { createDeployment } = yield Promise.resolve().then(() => __importStar(require('./services/deployment')));
        const deployment = yield createDeployment(id, user.id, repoUrl, repoName, branch);
        const files = (0, getAllfiles_1.getAllFiles)(outputPath);
        files.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
            const relativePath = element.slice(__dirname.length + 1).replace(/\\/g, '/');
            yield (0, upload_1.upload)(element, relativePath);
        }));
        yield new Promise((resolve) => setTimeout(resolve, 5000));
        redisClient.lPush("build-queue", id);
        redisClient.hSet("status", id, "uploaded");
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
        }
        catch (error) {
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
    }
    catch (error) {
        res.status(500).json({
            error: 'Deployment Failed',
            message: 'Failed to create deployment',
            code: 500,
            timestamp: new Date()
        });
    }
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    const response = yield redisClient.hGet("status", id);
    res.json({
        status: response,
    });
}));
app.get("/deployments", auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { getUserDeployments } = yield Promise.resolve().then(() => __importStar(require('./services/deployment')));
        const deployments = yield getUserDeployments(user.id);
        res.json({
            deployments,
            total: deployments.length
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch deployments',
            code: 500,
            timestamp: new Date()
        });
    }
}));
app.get("/deployments/:id", auth_1.requireAuth, validation_1.validateDeploymentId, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const deploymentId = req.params.id;
        const { getDeployment, checkOwnership } = yield Promise.resolve().then(() => __importStar(require('./services/deployment')));
        const hasOwnership = yield checkOwnership(user.id, deploymentId);
        if (!hasOwnership) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not own this deployment',
                code: 403,
                timestamp: new Date()
            });
        }
        const deployment = yield getDeployment(deploymentId);
        if (!deployment) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Deployment not found',
                code: 404,
                timestamp: new Date()
            });
        }
        res.json(deployment);
    }
    catch (error) {
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to fetch deployment',
            code: 500,
            timestamp: new Date()
        });
    }
}));
app.delete("/deployments/:id", auth_1.requireAuth, validation_1.validateDeploymentId, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const deploymentId = req.params.id;
        const { checkOwnership, deleteDeployment } = yield Promise.resolve().then(() => __importStar(require('./services/deployment')));
        const hasOwnership = yield checkOwnership(user.id, deploymentId);
        if (!hasOwnership) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not own this deployment',
                code: 403,
                timestamp: new Date()
            });
        }
        yield deleteDeployment(deploymentId);
        res.json({
            message: 'Deployment deleted successfully',
            id: deploymentId
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to delete deployment',
            code: 500,
            timestamp: new Date()
        });
    }
}));
app.post("/deployments/:id/redeploy", auth_1.requireAuth, validation_1.validateDeploymentId, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const deploymentId = req.params.id;
        const { checkOwnership, getDeployment, updateDeploymentStatus } = yield Promise.resolve().then(() => __importStar(require('./services/deployment')));
        const hasOwnership = yield checkOwnership(user.id, deploymentId);
        if (!hasOwnership) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not own this deployment',
                code: 403,
                timestamp: new Date()
            });
        }
        const deployment = yield getDeployment(deploymentId);
        if (!deployment) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Deployment not found',
                code: 404,
                timestamp: new Date()
            });
        }
        yield updateDeploymentStatus(deploymentId, 'uploaded');
        redisClient.lPush("build-queue", deploymentId);
        redisClient.hSet("status", deploymentId, "uploaded");
        try {
            const deployServiceUrl = process.env.DEPLOY_SERVICE_URL || "http://localhost:5501";
            yield fetch(`${deployServiceUrl}/deploy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }
        catch (error) {
            console.error("Error calling deploy service:", error);
        }
        res.json({
            message: 'Redeployment triggered successfully',
            id: deploymentId,
            status: 'uploaded'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to trigger redeployment',
            code: 500,
            timestamp: new Date()
        });
    }
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
const errorHandler_1 = require("./middleware/errorHandler");
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.UPLOAD_SERVICE_PORT || 5500;
app.listen(PORT, () => {
    console.log(`Upload service running on port ${PORT}`);
});
