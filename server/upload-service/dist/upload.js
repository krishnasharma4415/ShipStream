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
exports.upload = upload;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const r2Client_1 = require("./r2Client");
function upload(file, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileContent = fs_1.default.readFileSync(file);
        const command = new client_s3_1.PutObjectCommand({
            Bucket: r2Client_1.BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
        });
        try {
            const response = yield r2Client_1.r2Client.send(command);
            console.log(`Uploaded ${fileName} to R2:`, response);
        }
        catch (error) {
            console.error(`Error uploading ${fileName}:`, error);
            throw error;
        }
    });
}
