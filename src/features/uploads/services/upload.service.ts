import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";

export const ALLOWED_FOLDERS = [
  "categories",
  "brands",
  "products",
  "variants",
  "customers",
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
export const MAX_FILES_PER_REQUEST = 4;

function validateFolder(folder: unknown): AllowedFolder {
  if (!folder || typeof folder !== "string") {
    throw ApiError.badRequest("Upload folder name is required");
  }

  const cleanFolder = folder.trim().toLowerCase();

  // Prevent path traversal & validate whitelist
  if (
    cleanFolder.includes("..") ||
    cleanFolder.includes("/") ||
    cleanFolder.includes("\\") ||
    !ALLOWED_FOLDERS.includes(cleanFolder as AllowedFolder)
  ) {
    throw ApiError.badRequest(
      `Invalid upload folder. Allowed folders: ${ALLOWED_FOLDERS.join(", ")}`
    );
  }

  return cleanFolder as AllowedFolder;
}

export const uploadService = {
  /**
   * Single file upload handler: POST /api/admin/upload
   * Accepts ONLY a single file provided in the `file` form field.
   * Rejects if `files` field is sent or multiple files are submitted.
   */
  async handleSingleFileUpload(formData: FormData) {
    const cleanFolder = validateFolder(formData.get("folder"));

    // Check if multiple files field "files" was erroneously passed
    const filesArray = formData.getAll("files");
    if (filesArray.length > 0) {
      throw ApiError.badRequest(
        "Single-file upload endpoint does not accept multiple files. Use POST /api/admin/uploads instead."
      );
    }

    const fileEntries = formData.getAll("file");
    if (fileEntries.length === 0 || !(fileEntries[0] instanceof File)) {
      throw ApiError.badRequest("No image file provided");
    }

    if (fileEntries.length > 1) {
      throw ApiError.badRequest(
        "Single-file upload endpoint accepts only 1 file. Use POST /api/admin/uploads for multiple files."
      );
    }

    const file = fileEntries[0] as File;

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

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      cleanFolder
    );

    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueFilename = `${crypto.randomUUID()}${extension}`;
    const targetFilePath = path.join(uploadsDir, uniqueFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(targetFilePath, buffer);

    const webPath = `/uploads/${cleanFolder}/${uniqueFilename}`;

    return {
      path: webPath,
    };
  },

  /**
   * Multi-file upload handler: POST /api/admin/uploads
   * Accepts 1-4 files provided in the `files` form field.
   * Rejects if > 4 files or 0 files are submitted.
   */
  async handleMultiFileUpload(formData: FormData) {
    const cleanFolder = validateFolder(formData.get("folder"));

    const rawFiles = formData.getAll("files");

    const files: File[] = rawFiles.filter(
      (f): f is File => f instanceof File && f.name !== ""
    );

    if (files.length === 0) {
      throw ApiError.badRequest("No image files provided");
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      throw ApiError.badRequest(
        `Maximum ${MAX_FILES_PER_REQUEST} files allowed per upload request`
      );
    }

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      cleanFolder
    );

    await fs.mkdir(uploadsDir, { recursive: true });

    const createdPhysicalPaths: string[] = [];
    const webPaths: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size === 0) {
          throw ApiError.badRequest(
            `File #${i + 1} (${file.name || "image"}) is empty`
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          throw ApiError.badRequest(
            `File #${i + 1} (${file.name || "image"}) size exceeds maximum allowed limit of 5MB`
          );
        }

        const mimeType = file.type.toLowerCase();
        const extension = ALLOWED_MIME_TYPES[mimeType];

        if (!extension) {
          throw ApiError.badRequest(
            `File #${i + 1} (${file.name || "image"}) has an invalid type. Allowed image types: JPEG, PNG, WebP, GIF`
          );
        }

        const uniqueFilename = `${crypto.randomUUID()}${extension}`;
        const targetFilePath = path.join(uploadsDir, uniqueFilename);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.writeFile(targetFilePath, buffer);

        createdPhysicalPaths.push(targetFilePath);
        webPaths.push(`/uploads/${cleanFolder}/${uniqueFilename}`);
      }

      return {
        paths: webPaths,
      };
    } catch (error) {
      // Atomic Cleanup: Delete any files created during this request if any error occurs
      await Promise.all(
        createdPhysicalPaths.map(async (filePath) => {
          try {
            await fs.unlink(filePath);
          } catch {
            // Ignore cleanup error for unwritten file
          }
        })
      );

      throw error;
    }
  },

  /**
   * Safe physical file deletion helper.
   * Only deletes files inside public/uploads/<allowedFolder>/
   * Prevents path traversal and handles non-existent files gracefully.
   */
  async deleteUploadedFile(
    webPath: string | null | undefined,
    allowedFolder: AllowedFolder = "customers"
  ) {
    if (!webPath || typeof webPath !== "string") return;

    const normalizedFolder = validateFolder(allowedFolder);
    const normalizedWebPath = webPath.replace(/\\/g, "/");

    const expectedPrefix = `/uploads/${normalizedFolder}/`;
    if (!normalizedWebPath.startsWith(expectedPrefix)) {
      return;
    }

    const filename = normalizedWebPath.slice(expectedPrefix.length);

    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return;
    }

    const folderDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      normalizedFolder
    );
    const targetFilePath = path.join(folderDir, filename);

    const relative = path.relative(folderDir, targetFilePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return;
    }

    try {
      await fs.unlink(targetFilePath);
    } catch {
      // Ignore ENOENT (file not found) or filesystem errors safely
    }
  },
};
