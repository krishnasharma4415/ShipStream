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
exports.downloadR2Folder = downloadR2Folder;
exports.copyFinalDist = copyFinalDist;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const r2Client_1 = require("./r2Client");
function downloadR2Folder(prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket: r2Client_1.BUCKET_NAME,
            Prefix: prefix,
        });
        const allFiles = yield r2Client_1.r2Client.send(command);
        const allPromises = ((_a = allFiles.Contents) === null || _a === void 0 ? void 0 : _a.map((_a) => __awaiter(this, [_a], void 0, function* ({ Key }) {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                var _a, e_1, _b, _c;
                if (!Key) {
                    resolve("");
                    return;
                }
                const finalOutputPath = path_1.default.join(__dirname, Key);
                const dirName = path_1.default.dirname(finalOutputPath);
                if (!fs_1.default.existsSync(dirName)) {
                    fs_1.default.mkdirSync(dirName, { recursive: true });
                }
                try {
                    const getCommand = new client_s3_1.GetObjectCommand({
                        Bucket: r2Client_1.BUCKET_NAME,
                        Key,
                    });
                    const response = yield r2Client_1.r2Client.send(getCommand);
                    const chunks = [];
                    if (response.Body) {
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
                        fs_1.default.writeFileSync(finalOutputPath, fileContent);
                    }
                    resolve("");
                }
                catch (error) {
                    console.error(`Error downloading ${Key}:`, error);
                    resolve("");
                }
            }));
        }))) || [];
        console.log("Downloading files from R2...");
        yield Promise.all(allPromises === null || allPromises === void 0 ? void 0 : allPromises.filter((x) => x !== undefined));
    });
}
function copyFinalDist(id) {
    const projectPath = path_1.default.join(__dirname, `output/${id}`);
    // Common build output directories for different frameworks
    const possibleBuildDirs = ['dist', 'build', 'out', 'public'];
    let buildDir = null;
    let folderPath = null;
    // Find which build directory exists
    for (const dir of possibleBuildDirs) {
        const testPath = path_1.default.join(projectPath, dir);
        if (fs_1.default.existsSync(testPath)) {
            buildDir = dir;
            folderPath = testPath;
            console.log(`Found build directory: ${dir}`);
            break;
        }
    }
    // If no standard build directory found, check if there are any HTML files in the root
    if (!folderPath) {
        const rootFiles = fs_1.default.readdirSync(projectPath);
        const hasHtmlFiles = rootFiles.some(file => file.endsWith('.html'));
        if (hasHtmlFiles) {
            console.log('No build directory found, using project root (static files detected)');
            folderPath = projectPath;
            buildDir = '';
        }
        else {
            throw new Error(`No build output found in ${projectPath}. Checked directories: ${possibleBuildDirs.join(', ')}`);
        }
    }
    const allFiles = getAllFiles(folderPath);
    console.log(`Uploading ${allFiles.length} files from ${buildDir || 'root'} directory`);
    allFiles.forEach((file) => {
        const relativePath = file.slice(folderPath.length + 1);
        uploadFile(`dist/${id}/${relativePath}`, file);
    });
}
const getAllFiles = (folderPath) => {
    let response = [];
    if (!fs_1.default.existsSync(folderPath)) {
        console.error(`Directory does not exist: ${folderPath}`);
        return response;
    }
    try {
        const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
        allFilesAndFolders.forEach((file) => {
            const fullFilePath = path_1.default.join(folderPath, file);
            if (fs_1.default.statSync(fullFilePath).isDirectory()) {
                response = response.concat(getAllFiles(fullFilePath));
            }
            else {
                response.push(fullFilePath);
            }
        });
    }
    catch (error) {
        console.error(`Error reading directory ${folderPath}:`, error);
    }
    return response;
};
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = fs_1.default.readFileSync(localFilePath);
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
