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
const r2Storage_1 = require("./r2Storage");
const execute_1 = require("./execute");
const redisClient_1 = require("./redisClient");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Initialize Redis client
const redisClient = (0, redisClient_1.createRedisClient)();
// Connect to Redis
redisClient.connect().catch(console.error);
function processQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            while (true) {
                const response = yield redisClient.brPop("build-queue", 1 // 1 second timeout instead of blocking indefinitely
                );
                if (response) {
                    const id = response.element;
                    console.log(`Processing deployment for ID: ${id}`);
                    yield (0, r2Storage_1.downloadR2Folder)(`output/${id}/`);
                    yield (0, execute_1.buildProject)(id);
                    (0, r2Storage_1.copyFinalDist)(id);
                    redisClient.hSet("status", id, "deployed");
                    console.log(`Deployment completed for ID: ${id}`);
                }
                else {
                    // No more items in queue, break the loop
                    break;
                }
            }
        }
        catch (error) {
            console.error("Error processing queue:", error);
            throw error;
        }
    });
}
// Endpoint to trigger deployment processing
app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Deploy endpoint triggered, processing queue...");
        yield processQueue();
        res.json({
            success: true,
            message: "Queue processed successfully",
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error("Error in deploy endpoint:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process deployment queue",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));
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
