"use client";

import React, { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropperModal } from "@/components/common";

interface FormImageUploadProps {
  name: string;
  label: string;
  folder?: string;
  cropWidth?: number;
  cropHeight?: number;
  enableCrop?: boolean;
  className?: string;
  aspectRatioClassName?: string;
  required?: boolean;
  maxSizeMB?: number;
}

function FormImageUpload({
  name,
  label,
  folder = "categories",
  cropWidth = 500,
  cropHeight = 500,
  enableCrop = true,
  className,
  aspectRatioClassName = "h-48",
  required,
  maxSizeMB = 5,
}: FormImageUploadProps) {
  const { control } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const imageUrl = field.value as string;

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setFileError(null);

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(
          `Image size cannot exceed ${maxSizeMB}MB (Selected: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB).`
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Image upload failed");
      }

      // Save uploaded image path in the form
      field.onChange(result.data.path);
    } catch (err: any) {
      console.error("Image upload error:", err);
      setFileError(err?.message || "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError(
        `File size exceeds the maximum allowed limit of ${maxSizeMB}MB (Selected: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB).`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    setFileError(null);

    if (!enableCrop) {
      uploadFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setCropSrc(URL.createObjectURL(file));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropConfirm = async (croppedFile: File) => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
    setSelectedFile(null);
    await uploadFile(croppedFile);
  };

  const handleCropCancel = () => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayError = fileError || error?.message;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-neutral-700)]">
          {label}
          {required && <span className="text-error-600 font-bold ml-1">*</span>}
        </label>
        <span className="text-xs font-medium text-neutral-400">
          Max size: {maxSizeMB} MB
        </span>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] transition-all hover:border-[var(--color-primary-500)] hover:bg-white overflow-hidden",
          aspectRatioClassName,
          displayError && "border-[var(--color-error-500)]",
          className
        )}
      >
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Preview"
              fill
              className="rounded-xl object-cover"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                field.onChange("");
                setFileError(null);
              }}
              className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-md hover:bg-neutral-100 transition-colors"
              title="Remove image"
            >
              <X className="h-4 w-4 text-[var(--color-neutral-700)]" />
            </button>
          </>
        ) : isUploading ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary-500)] border-t-transparent" />
            <p className="text-sm text-[var(--color-neutral-500)]">
              Uploading image...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 text-center px-4">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <Upload className="h-6 w-6 text-[var(--color-neutral-500)]" />
            </div>

            <div>
              <p className="font-medium text-[var(--color-neutral-700)] text-sm">
                Upload Image
              </p>
              <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                JPG, PNG, WebP • Max {maxSizeMB}MB • {cropWidth} × {cropHeight} px
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {displayError && (
        <p className="text-xs font-medium text-[var(--color-error-600)]">
          {displayError}
        </p>
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        originalFileName={selectedFile?.name}
        mimeType={selectedFile?.type || "image/jpeg"}
        title={`Crop ${label || "Image"}`}
        description={`Reposition and zoom to fit the ${cropWidth} × ${cropHeight} px area (Max ${maxSizeMB}MB).`}
        cropWidth={cropWidth}
        cropHeight={cropHeight}
        onCropConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
}

export { FormImageUpload };