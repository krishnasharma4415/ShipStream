import { commandOptions } from "redis";
import { copyFinalDist, downloadR2Folder } from "./r2Storage";
import { buildProject } from "./execute";
import { createRedisClient } from "./redisClient";

// Initialize Redis clients
const subscriber = createRedisClient();
const publisher = createRedisClient();

// Connect to Redis
subscriber.connect().catch(console.error);
publisher.connect().catch(console.error);

async function sub() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        "build-queue",
        0
      );

      if (response) {
        const id = response.element[1];
        await downloadR2Folder(`output${id}`);
        await buildProject(id);
        copyFinalDist(id);
        publisher.hSet("status", id, "deployed");
      }
    } catch (error) {
      console.error("Error processing message from Redis:", error);
    }
  }
}

sub().catch((error) => {
  console.error("Error in subscription function:", error);
});
