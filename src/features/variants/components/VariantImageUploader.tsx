"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useVariantImages,
  useCreateVariantImages,
  useDeleteVariantImage,
} from "../hooks";
import {
  uploadVariantImageFiles,
  uploadVariantImageFile,
} from "../api/get-variants";

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface VariantImageUploaderProps {
  productUuid: string;
  variantUuid: string;
  variantName?: string;
  isStepperMode?: boolean;
  onFinish?: () => void;
  onSkip?: () => void;
}

export function VariantImageUploader({
  productUuid,
  variantUuid,
  variantName,
  isStepperMode = false,
  onFinish,
  onSkip,
}: VariantImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: existingImages = [], isLoading: isLoadingExisting } =
    useVariantImages(productUuid, variantUuid);

  const createImagesMutation = useCreateVariantImages();
  const deleteImageMutation = useDeleteVariantImage();

  const totalImageCount = existingImages.length + pendingImages.length;
  const maxAllowedImages = 4;
  const canAddMore = totalImageCount < maxAllowedImages;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxAllowedImages - totalImageCount;
    if (remainingSlots <= 0) {
      setErrorMessage(`Maximum of ${maxAllowedImages} images allowed per variant.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const validFiles: PendingImage[] = [];

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    for (const file of filesToProcess) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setErrorMessage("Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.");
        return;
      }
      if (file.size > maxSizeBytes) {
        setErrorMessage(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }

      const hasAnyPrimary =
        existingImages.some((img) => img.isPrimary) ||
        pendingImages.some((img) => img.isPrimary) ||
        validFiles.some((img) => img.isPrimary);

      validFiles.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: !hasAnyPrimary && validFiles.length === 0 && existingImages.length === 0,
        sortOrder: totalImageCount + validFiles.length + 1,
      });
    }

    setPendingImages((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // If we removed the primary image, make the first one primary if available
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary) && existingImages.length === 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryPendingImage = (id: string) => {
    setPendingImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleUploadAndSave = async () => {
    if (pendingImages.length === 0) {
      if (onFinish) onFinish();
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      // 1. Upload files to multipart upload endpoint
      let uploadedPaths: string[] = [];

      if (pendingImages.length === 1) {
        const res = await uploadVariantImageFile(pendingImages[0].file, "variants");
        uploadedPaths = [res.path];
      } else {
        const res = await uploadVariantImageFiles(
          pendingImages.map((p) => p.file),
          "variants"
        );
        uploadedPaths = res.paths;
      }

      // 2. Associate image metadata with the variant
      const imagePayload = pendingImages.map((p, idx) => ({
        imageUrl: uploadedPaths[idx],
        sortOrder: p.sortOrder,
        isPrimary: p.isPrimary,
      }));

      await createImagesMutation.mutateAsync({
        productUuid,
        variantUuid,
        images: imagePayload,
      });

      setSuccessMessage("Images uploaded and saved successfully!");
      setPendingImages([]);

      if (onFinish) {
        setTimeout(() => {
          onFinish();
        }, 600);
      }
    } catch (err: unknown) {
      console.error("Failed to upload variant images:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to upload images. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteExistingImage = async (imageUuid: string) => {
    try {
      setErrorMessage(null);
      await deleteImageMutation.mutateAsync({
        productUuid,
        variantUuid,
        imageUuid,
      });
      setSuccessMessage("Image deleted successfully.");
    } catch (err: unknown) {
      console.error("Failed to delete image:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete image."
      );
    }
  };

  return (
    <div className="space-y-6">
      {variantName && (
        <div className="rounded-xl bg-[var(--color-primary-50)] p-4 border border-[var(--color-primary-100)]">
          <p className="text-sm font-medium text-[var(--color-primary-900)]">
            Managing images for: <span className="font-semibold">{variantName}</span>
          </p>
          <p className="text-xs text-[var(--color-neutral-600)] mt-1">
            Upload up to {maxAllowedImages} product images (JPG, PNG, WebP, GIF, max 5MB each). Mark one as primary.
          </p>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--color-error-50)] p-3 text-sm text-[var(--color-error-700)] border border-[var(--color-error-200)]">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--color-success-50)] p-3 text-sm text-[var(--color-success-700)] border border-[var(--color-success-200)]">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Existing Uploaded Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-neutral-600)] mb-3">
            Current Images ({existingImages.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)]"
              >
                <Image
                  src={img.imageUrl}
                  alt="Variant Image"
                  fill
                  className="object-cover"
                />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-secondary-600)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    <Star className="h-3 w-3 fill-current" /> Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteExistingImage(img.id)}
                  disabled={deleteImageMutation.isPending}
                  aria-label="Delete Image"
                  className="absolute top-2 right-2 rounded-lg bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-error-600)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending / Selected Images for Upload */}
      {pendingImages.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-neutral-600)] mb-3">
            New Images To Upload ({pendingImages.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {pendingImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[var(--color-primary-400)] bg-white p-1"
              >
                <div className="relative h-full w-full rounded-lg overflow-hidden">
                  <Image
                    src={img.previewUrl}
                    alt="Pending Image"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingImage(img.id)}
                    aria-label="Remove Image"
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-[var(--color-error-600)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrimaryPendingImage(img.id)}
                    className={`absolute bottom-1.5 left-1.5 right-1.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${
                      img.isPrimary
                        ? "bg-[var(--color-secondary-600)] text-white shadow"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    <Star className={`h-3 w-3 ${img.isPrimary ? "fill-current" : ""}`} />
                    {img.isPrimary ? "Primary" : "Set Primary"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      {canAddMore ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] hover:bg-white hover:border-[var(--color-primary-500)] cursor-pointer transition-all text-center"
        >
          <div className="rounded-full bg-white p-3 shadow-sm mb-3">
            <Upload className="h-6 w-6 text-[var(--color-neutral-600)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-neutral-800)]">
            Click or drag & drop to upload images
          </p>
          <p className="text-xs text-[var(--color-neutral-500)] mt-1">
            PNG, JPG, WebP, GIF up to 5MB (Remaining slots: {maxAllowedImages - totalImageCount})
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <p className="text-xs text-center text-[var(--color-neutral-500)] italic">
          Maximum limit of {maxAllowedImages} images reached for this variant.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-neutral-200)]">
        {isStepperMode ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="rounded-xl border-[var(--color-neutral-300)] text-[var(--color-neutral-700)]"
            >
              Skip for now
            </Button>

            <Button
              type="button"
              onClick={handleUploadAndSave}
              isLoading={isUploading}
              className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
            >
              {pendingImages.length > 0 ? "Upload & Finish" : "Finish"}
            </Button>
          </>
        ) : (
          <div className="flex justify-end w-full">
            <Button
              type="button"
              onClick={handleUploadAndSave}
              isLoading={isUploading}
              disabled={pendingImages.length === 0}
              className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
            >
              Upload Images
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
