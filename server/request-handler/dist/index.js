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
app.get("/*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const host = req.hostname;
        const id = host.split(".")[0];
        const filePath = req.path;
        // Default to index.html if path is root
        const key = `dist/${id}${filePath === "/" ? "/index.html" : filePath}`;
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
                            : "text/plain";
            res.set("Content-Type", type);
            res.send(fileContent);
        }
        else {
            res.status(404).send("File not found");
        }
    }
    catch (error) {
        console.error("Error serving file:", error);
        res.status(404).send("File not found");
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Request handler running on port ${PORT}`);
});
