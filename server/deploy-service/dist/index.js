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
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const r2Storage_1 = require("./r2Storage");
const execute_1 = require("./execute");
const redisClient_1 = require("./redisClient");
// Initialize Redis clients
const subscriber = (0, redisClient_1.createRedisClient)();
const publisher = (0, redisClient_1.createRedisClient)();
// Connect to Redis
subscriber.connect().catch(console.error);
publisher.connect().catch(console.error);
function sub() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                const response = yield subscriber.brPop((0, redis_1.commandOptions)({ isolated: true }), "build-queue", 0);
                if (response) {
                    const id = response.element[1];
                    yield (0, r2Storage_1.downloadR2Folder)(`output${id}`);
                    yield (0, execute_1.buildProject)(id);
                    (0, r2Storage_1.copyFinalDist)(id);
                    publisher.hSet("status", id, "deployed");
                }
            }
            catch (error) {
                console.error("Error processing message from Redis:", error);
            }
        }
    });
}
sub().catch((error) => {
    console.error("Error in subscription function:", error);
});
