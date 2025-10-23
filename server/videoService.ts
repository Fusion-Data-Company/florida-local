import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { uploadToCDN } from "./cdnService";
import { logger } from "./monitoring";
import { imageQueue } from "./redis";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

interface VideoProcessingOptions {
  formats?: Array<{
    name: string;
    width?: number;
    height?: number;
    bitrate?: string;
    codec?: string;
  }>;
  thumbnail?: boolean;
  thumbnailCount?: number;
  preview?: boolean;
  previewDuration?: number;
}

interface ProcessedVideo {
  original: string;
  formats: Record<string, string>;
  thumbnails?: string[];
  preview?: string;
  metadata: VideoMetadata;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
  fileSize: number;
}

// Default video formats for adaptive streaming
const DEFAULT_FORMATS = [
  { name: "1080p", width: 1920, height: 1080, bitrate: "5000k", codec: "libx264" },
  { name: "720p", width: 1280, height: 720, bitrate: "2500k", codec: "libx264" },
  { name: "480p", width: 854, height: 480, bitrate: "1000k", codec: "libx264" },
  { name: "360p", width: 640, height: 360, bitrate: "500k", codec: "libx264" },
];

// Process video file
export async function processVideo(
  inputPath: string,
  outputKey: string,
  options: VideoProcessingOptions = {}
): Promise<ProcessedVideo> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-"));
  
  try {
    // Get video metadata
    const metadata = await getVideoMetadata(inputPath);
    
    // Upload original
    const originalBuffer = await fs.readFile(inputPath);
    const originalUrl = await uploadToCDN(`${outputKey}/original.mp4`, originalBuffer, {
      contentType: "video/mp4",
      metadata: {
        duration: metadata.duration.toString(),
        width: metadata.width.toString(),
        height: metadata.height.toString(),
      },
    });

    const result: ProcessedVideo = {
      original: originalUrl,
      formats: {},
      metadata,
    };

    // Process formats
    const formats = options.formats || DEFAULT_FORMATS;
    for (const format of formats) {
      const formatPath = path.join(tempDir, `${format.name}.mp4`);
      await transcodeVideo(inputPath, formatPath, format);
      
      const formatBuffer = await fs.readFile(formatPath);
      const formatUrl = await uploadToCDN(
        `${outputKey}/${format.name}.mp4`,
        formatBuffer,
        {
          contentType: "video/mp4",
          metadata: {
            width: format.width?.toString() || "",
            height: format.height?.toString() || "",
            bitrate: format.bitrate || "",
          },
        }
      );
      
      result.formats[format.name] = formatUrl;
    }

    // Generate thumbnails
    if (options.thumbnail !== false) {
      result.thumbnails = await generateThumbnails(
        inputPath,
        outputKey,
        options.thumbnailCount || 3,
        metadata.duration
      );
    }

    // Generate preview clip
    if (options.preview) {
      result.preview = await generatePreview(
        inputPath,
        outputKey,
        options.previewDuration || 10
      );
    }

    logger.info("Video processed successfully", { outputKey, formats: Object.keys(result.formats) });
    
    return result;
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// Get video metadata
function getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const video = metadata.streams.find(s => s.codec_type === "video");
      if (!video) {
        reject(new Error("No video stream found"));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: video.width || 0,
        height: video.height || 0,
        codec: video.codec_name || "",
        bitrate: parseInt(metadata.format.bit_rate || "0"),
        fps: eval(video.r_frame_rate || "0"),
        fileSize: parseInt(metadata.format.size || "0"),
      });
    });
  });
}

// Transcode video to different format
function transcodeVideo(
  inputPath: string,
  outputPath: string,
  format: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .outputOptions([
        "-preset fast",
        "-movflags +faststart", // Enable fast start for web playback
        "-pix_fmt yuv420p", // Ensure compatibility
      ]);

    // Set resolution if specified
    if (format.width && format.height) {
      command = command.size(`${format.width}x${format.height}`);
    } else if (format.width) {
      command = command.size(`${format.width}x?`);
    } else if (format.height) {
      command = command.size(`?x${format.height}`);
    }

    // Set bitrate
    if (format.bitrate) {
      command = command.videoBitrate(format.bitrate);
    }

    // Set codec
    if (format.codec) {
      command = command.videoCodec(format.codec);
    }

    command
      .audioCodec("aac")
      .audioBitrate("128k")
      .output(outputPath)
      .on("progress", (progress) => {
        logger.debug("Transcoding progress", { percent: progress.percent });
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

// Generate video thumbnails
async function generateThumbnails(
  inputPath: string,
  outputKey: string,
  count: number,
  duration: number
): Promise<string[]> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "thumbs-"));
  const thumbnails: string[] = [];

  try {
    for (let i = 0; i < count; i++) {
      const timestamp = (duration / (count + 1)) * (i + 1);
      const thumbPath = path.join(tempDir, `thumb-${i}.jpg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(timestamp)
          .frames(1)
          .size("1280x720")
          .output(thumbPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });

      const thumbBuffer = await fs.readFile(thumbPath);
      const thumbUrl = await uploadToCDN(
        `${outputKey}/thumb-${i}.jpg`,
        thumbBuffer,
        {
          contentType: "image/jpeg",
          cacheControl: "public, max-age=31536000, immutable",
        }
      );

      thumbnails.push(thumbUrl);
    }

    return thumbnails;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// Generate preview clip
async function generatePreview(
  inputPath: string,
  outputKey: string,
  duration: number
): Promise<string> {
  const tempPath = path.join(os.tmpdir(), `preview-${Date.now()}.mp4`);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setDuration(duration)
        .size("640x360")
        .videoBitrate("500k")
        .audioCodec("aac")
        .audioBitrate("64k")
        .outputOptions(["-preset fast", "-movflags +faststart"])
        .output(tempPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    const previewBuffer = await fs.readFile(tempPath);
    const previewUrl = await uploadToCDN(
      `${outputKey}/preview.mp4`,
      previewBuffer,
      {
        contentType: "video/mp4",
        metadata: { type: "preview", duration: duration.toString() },
      }
    );

    return previewUrl;
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

// Generate HLS playlist for adaptive streaming
export async function generateHLSPlaylist(
  inputPath: string,
  outputKey: string
): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hls-"));
  
  try {
    const playlistPath = path.join(tempDir, "playlist.m3u8");

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-preset fast",
          "-hls_time 10",
          "-hls_list_size 0",
          "-hls_segment_filename", path.join(tempDir, "segment%03d.ts"),
          "-master_pl_name master.m3u8",
          "-var_stream_map", "v:0,a:0",
        ])
        .output(playlistPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    // Upload all segments and playlists
    const files = await fs.readdir(tempDir);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const fileBuffer = await fs.readFile(filePath);
      
      await uploadToCDN(
        `${outputKey}/hls/${file}`,
        fileBuffer,
        {
          contentType: file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t",
          cacheControl: file.endsWith(".m3u8") ? "no-cache" : "public, max-age=31536000",
        }
      );
    }

    return `${outputKey}/hls/master.m3u8`;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// Queue video processing job
export async function queueVideoProcessing(
  inputPath: string,
  outputKey: string,
  options?: VideoProcessingOptions
) {
  await imageQueue.add(
    "process-video",
    {
      inputPath,
      outputKey,
      options,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
  
  logger.info("Video processing job queued", { outputKey });
}
