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
}: FormImageUploadProps) {
  const { control } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--color-neutral-700)]">
        {label}
      </label>

      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] transition-all hover:border-[var(--color-primary-500)] hover:bg-white overflow-hidden",
          aspectRatioClassName,
          error && "border-[var(--color-error-500)]",
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
              }}
              className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-md"
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
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <Upload className="h-6 w-6 text-[var(--color-neutral-500)]" />
            </div>

            <div>
              <p className="font-medium text-[var(--color-neutral-700)]">
                Upload Image
              </p>
              <p className="text-sm text-[var(--color-neutral-500)]">
                Click to browse (JPG, PNG, WEBP) • {cropWidth} × {cropHeight} px
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error-600)]">
          {error.message}
        </p>
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        originalFileName={selectedFile?.name}
        mimeType={selectedFile?.type || "image/jpeg"}
        title={`Crop ${label || "Image"}`}
        description={`Reposition and zoom to fit the ${cropWidth} × ${cropHeight} px area.`}
        cropWidth={cropWidth}
        cropHeight={cropHeight}
        onCropConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
}

export { FormImageUpload };