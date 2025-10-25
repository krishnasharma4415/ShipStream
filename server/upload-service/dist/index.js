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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const randomGenerate_1 = require("./randomGenerate");
const simple_git_1 = __importDefault(require("simple-git"));
const getAllfiles_1 = require("./getAllfiles");
const path_1 = __importDefault(require("path"));
const upload_1 = require("./upload");
const redisClient_1 = require("./redisClient");
const app = (0, express_1.default)();
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || ["http://localhost:5173", "http://localhost:3000"],
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
    publisher.lPush("build-queue", id);
    publisher.hSet("status", id, "uploaded");
    res.json({ generated: id, files });
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    const response = yield subscriber.hGet("status", id);
    res.json({
        status: response,
    });
}));
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Upload service running on port ${PORT}`);
});
