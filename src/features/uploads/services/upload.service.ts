import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";

export const ALLOWED_FOLDERS = [
  "categories",
  "brands",
  "products",
  "variants",
] as const;

export type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadService = {
  async handleFileUpload(formData: FormData) {
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!file || !(file instanceof File)) {
      throw ApiError.badRequest("No image file provided");
    }

    if (!folder || typeof folder !== "string") {
      throw ApiError.badRequest("Upload folder name is required");
    }

    const cleanFolder = folder.trim().toLowerCase();

    if (!ALLOWED_FOLDERS.includes(cleanFolder as AllowedFolder)) {
      throw ApiError.badRequest(
        `Invalid upload folder. Allowed folders: ${ALLOWED_FOLDERS.join(", ")}`
      );
    }

    if (file.size === 0) {
      throw ApiError.badRequest("Uploaded file is empty");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw ApiError.badRequest(
        "File size exceeds maximum allowed limit of 5MB"
      );
    }

    const mimeType = file.type.toLowerCase();
    const extension = ALLOWED_MIME_TYPES[mimeType];

    if (!extension) {
      throw ApiError.badRequest(
        "Invalid file type. Allowed image types: JPEG, PNG, WebP, GIF"
      );
    }

    // Generate safe unique filename
    const uniqueFilename = `${crypto.randomUUID()}${extension}`;

    // Target directory inside public/uploads/<folder>
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      cleanFolder
    );

    // Create directory recursively if it doesn't exist
    await fs.mkdir(uploadsDir, { recursive: true });

    const targetFilePath = path.join(uploadsDir, uniqueFilename);

    // Convert File object to Buffer and save to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(targetFilePath, buffer);

    // Relative path for frontend preview
    const webPath = `/uploads/${cleanFolder}/${uniqueFilename}`;

    return {
      path: webPath,
    };
  },
};
