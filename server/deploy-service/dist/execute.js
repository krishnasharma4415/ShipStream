"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProject = buildProject;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
function buildProject(id) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        const projectPath = path_1.default.join(__dirname, `output/${id}`);
        console.log(`Building project at: ${projectPath}`);
        const child = (0, child_process_1.exec)(`cd "${projectPath}" && npm i && npm run build`, { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer for large build outputs
        );
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            console.log(`Build stdout: ${data}`);
        });
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
            console.error(`Build stderr: ${data}`);
        });
        child.on("close", function (code) {
            console.log(`Build process exited with code: ${code}`);
            if (code === 0) {
                resolve("");
            }
            else {
                reject(new Error(`Build failed with exit code: ${code}`));
            }
        });
        child.on("error", function (error) {
            console.error(`Build process error: ${error}`);
            reject(error);
        });
    });
}
