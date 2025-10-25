"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_NAME = exports.r2Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
exports.r2Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});
exports.BUCKET_NAME = process.env.R2_BUCKET_NAME || "vercel-clone";
