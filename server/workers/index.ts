import { logger } from "../monitoring";
import { checkRedisConnection } from "../redis";

// Import workers
import { emailWorker } from "./emailWorker";
import { imageWorker } from "./imageWorker";

// Worker health tracking
const workers = {
  email: emailWorker,
  image: imageWorker,
};

// Start all workers
export async function startWorkers() {
  // Check Redis connection first
  const redisHealthy = await checkRedisConnection();
  
  if (!redisHealthy) {
    logger.error("Cannot start workers - Redis not connected");
    return false;
  }

  logger.info("Starting background workers...");

  // Start each worker
  for (const [name, worker] of Object.entries(workers)) {
    try {
      await worker.run();
      logger.info(`✅ ${name} worker started`);
    } catch (error) {
      logger.error(`❌ Failed to start ${name} worker`, { error });
    }
  }

  // Set up graceful shutdown
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, closing workers...");
    await stopWorkers();
  });

  process.on("SIGINT", async () => {
    logger.info("SIGINT received, closing workers...");
    await stopWorkers();
  });

  return true;
}

// Stop all workers
export async function stopWorkers() {
  logger.info("Stopping background workers...");

  for (const [name, worker] of Object.entries(workers)) {
    try {
      await worker.close();
      logger.info(`✅ ${name} worker stopped`);
    } catch (error) {
      logger.error(`❌ Failed to stop ${name} worker`, { error });
    }
  }
}

// Get worker status
export function getWorkerStatus() {
  const status: Record<string, any> = {};

  for (const [name, worker] of Object.entries(workers)) {
    status[name] = {
      running: worker.isRunning(),
      paused: worker.isPaused(),
    };
  }

  return status;
}

// If running as standalone worker process
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorkers().then((success) => {
    if (success) {
      logger.info("🚀 Workers started successfully");
    } else {
      logger.error("❌ Failed to start workers");
      process.exit(1);
    }
  });
}
