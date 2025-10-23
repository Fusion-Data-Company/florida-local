import { Response } from "express";
import { randomUUID } from "crypto";
import {
  File,
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";
import fs from "fs";
import path from "path";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Simple object storage client for Replit's built-in object storage service.
// Simple file implementation for Replit's object storage
class SimpleFile implements File {
  constructor(public name: string, public bucket: { name: string }, private fullPath: string) {}
  
  async exists(): Promise<[boolean]> {
    // For Replit object storage, we'll use the sidecar API to check existence
    try {
      const response = await fetch(
        `${REPLIT_SIDECAR_ENDPOINT}/object-storage/object-exists`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ object_path: this.fullPath })
        }
      );
      const result = await response.json();
      return [result.exists || false];
    } catch {
      return [false];
    }
  }
  
  async getMetadata(): Promise<[{ metadata?: Record<string, any>; contentType?: string; size?: string }]> {
    try {
      const response = await fetch(
        `${REPLIT_SIDECAR_ENDPOINT}/object-storage/object-metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ object_path: this.fullPath })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        return [{
          metadata: result.metadata || {},
          contentType: result.content_type || this.inferContentType(),
          size: result.size?.toString() || "0"
        }];
      }
    } catch (error) {
      console.error('Error getting metadata:', error);
    }
    
    // Fallback with inferred content type
    return [{ 
      metadata: {}, 
      contentType: this.inferContentType(), 
      size: "0" 
    }];
  }
  
  private inferContentType(): string {
    const ext = this.name.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }
  
  async setMetadata(metadata: { metadata: Record<string, any> }): Promise<void> {
    try {
      const response = await fetch(
        `${REPLIT_SIDECAR_ENDPOINT}/object-storage/set-object-metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            object_path: this.fullPath,
            metadata: metadata.metadata
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to set metadata: ${response.status}`);
      }
    } catch (error) {
      console.error('Error setting metadata:', error);
      throw error;
    }
  }
  
  createReadStream(): NodeJS.ReadableStream {
    // Create a proper stream that fetches the object from Replit's object storage
    const { Readable } = require('stream');
    
    // CRITICAL FIX: Capture fullPath outside before context changes
    const objectPath = this.fullPath;
    let started = false;
    
    const stream = new Readable({
      async read() {
        // Prevent multiple concurrent reads
        if (started) {
          return;
        }
        started = true;
        
        try {
          const response = await fetch(
            `${REPLIT_SIDECAR_ENDPOINT}/object-storage/download-object`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ object_path: objectPath }) // Use captured objectPath
            }
          );
          
          if (response.ok && response.body) {
            const reader = response.body.getReader();
            const pump = async (): Promise<void> => {
              try {
                const { value, done } = await reader.read();
                if (done) {
                  this.push(null); // End stream
                } else {
                  this.push(Buffer.from(value));
                  // Continue pumping with backpressure handling
                  setImmediate(() => pump());
                }
              } catch (error) {
                this.emit('error', error);
              }
            };
            pump();
          } else {
            const errorText = await response.text();
            this.emit('error', new Error(`Failed to download object: ${response.status} - ${errorText}`));
          }
        } catch (error) {
          this.emit('error', error);
        }
      }
    });
    return stream;
  }
}

// Simple bucket implementation
class SimpleBucket {
  constructor(public name: string) {}
  
  file(objectName: string): File {
    const fullPath = `/${this.name}/${objectName}`;
    return new SimpleFile(objectName, { name: this.name }, fullPath);
  }
}

// Simple storage client
export const objectStorageClient = {
  bucket(bucketName: string) {
    return new SimpleBucket(bucketName);
  }
};

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      // Get the ACL policy for the object.
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity with safe key generation.
  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = this.generateSafeObjectKey();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL (15 minutes for upload)
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the upload URL for a product image in the public directory
  async getProductImageUploadURL(businessId: string, productId: string, filename: string): Promise<{ uploadUrl: string; publicPath: string }> {
    const publicObjectSearchPaths = this.getPublicObjectSearchPaths();
    if (!publicObjectSearchPaths || publicObjectSearchPaths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var."
      );
    }

    const publicPath = publicObjectSearchPaths[0];
    const objectId = this.generateSafeObjectKey();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-]/g, '-');
    const objectKey = `products/${businessId}/${productId}/${objectId}-${sanitizedFilename}`;
    const fullPath = `${publicPath}/${objectKey}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL (5 minutes for upload)
    const uploadUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 300,
    });

    return {
      uploadUrl,
      publicPath: `/public-objects/${objectKey}`,
    };
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(
    rawPath: string,
  ): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
  
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
  
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
  
    // Extract the entity ID from the path
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
  
  // Extract object ID from object path for public URL generation
  extractObjectIdFromPath(objectPath: string): string {
    // Object path format: /objects/uploads/{objectId}
    const parts = objectPath.split('/');
    if (parts.length >= 4 && parts[1] === 'objects' && parts[2] === 'uploads') {
      return parts[3];
    }
    // Fallback: return last part of the path
    return parts[parts.length - 1] || 'unknown';
  }
  
  // Generate sanitized object key for uploads
  generateSafeObjectKey(): string {
    const objectId = randomUUID();
    // Ensure object ID contains only safe characters
    return objectId.replace(/[^a-zA-Z0-9\-]/g, '-');
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}