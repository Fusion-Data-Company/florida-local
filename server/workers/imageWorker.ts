import { Worker, Job } from "bullmq";
import { queueConnection } from "../redis";
import sharp from "sharp";
import path from "path";

interface ImageJobData {
  filePath: string;
  businessId: string;
  productId?: string;
  operations: Array<{
    type: "resize" | "optimize" | "thumbnail" | "watermark";
    options?: any;
  }>;
}

// Image processing worker
export const imageWorker = new Worker<ImageJobData>(
  "image-processing",
  async (job: Job<ImageJobData>) => {
    const { filePath, operations } = job.data;
    
    console.log(`🖼️ Processing image job ${job.id}: ${filePath}`);
    
    try {
      const results = [];
      
      for (const operation of operations) {
        const result = await processImageOperation(filePath, operation);
        results.push(result);
      }
      
      console.log(`✅ Image processing completed: ${job.id}`);
      return { success: true, results };
      
    } catch (error) {
      console.error(`❌ Image job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: queueConnection,
    concurrency: 3,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 25 },
  }
);

async function processImageOperation(
  filePath: string,
  operation: ImageJobData["operations"][0]
): Promise<any> {
  const image = sharp(filePath);
  const outputDir = path.dirname(filePath);
  const fileName = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  
  switch (operation.type) {
    case "resize":
      const { width, height } = operation.options || {};
      const resizedPath = path.join(outputDir, `${fileName}_${width}x${height}${ext}`);
      await image
        .resize(width, height, { fit: "cover", withoutEnlargement: true })
        .toFile(resizedPath);
      return { type: "resize", path: resizedPath };
      
    case "optimize":
      const optimizedPath = path.join(outputDir, `${fileName}_optimized${ext}`);
      await image
        .jpeg({ quality: 85, progressive: true })
        .png({ compressionLevel: 9 })
        .webp({ quality: 85 })
        .toFile(optimizedPath);
      return { type: "optimize", path: optimizedPath };
      
    case "thumbnail":
      const thumbPath = path.join(outputDir, `${fileName}_thumb${ext}`);
      await image
        .resize(150, 150, { fit: "cover" })
        .toFile(thumbPath);
      return { type: "thumbnail", path: thumbPath };
      
    case "watermark":
      // TODO: Implement watermark
      return { type: "watermark", status: "not_implemented" };
      
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

// Queue image processing helper
export async function queueImageProcessing(
  filePath: string,
  businessId: string,
  productId?: string,
  operations?: ImageJobData["operations"]
) {
  const { imageQueue } = await import("../redis");
  
  const defaultOperations: ImageJobData["operations"] = [
    { type: "optimize" },
    { type: "resize", options: { width: 800, height: 600 } },
    { type: "resize", options: { width: 400, height: 300 } },
    { type: "thumbnail" },
  ];
  
  await imageQueue.add(
    "process-image",
    {
      filePath,
      businessId,
      productId,
      operations: operations || defaultOperations,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );
}

// Worker event handlers
imageWorker.on("completed", (job) => {
  console.log(`✅ Image job ${job.id} completed`);
});

imageWorker.on("failed", (job, err) => {
  console.error(`❌ Image job ${job?.id} failed:`, err);
});
