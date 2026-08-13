"use client";

import React, { useRef } from "react";
import { useController, useFormContext } from "react-hook-form";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormImageUploadProps {
  name: string;
  label: string;
}

function FormImageUpload({ name, label }: FormImageUploadProps) {
  const { control } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const imageUrl = field.value as string;

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
        ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "categories");

            const response = await fetch("/api/admin/uploads", {
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

        } catch (error) {
            console.error("Image upload error:", error);
        } finally {
            setIsUploading(false);
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
          "relative flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] transition-all hover:border-[var(--color-primary-500)] hover:bg-white",
          error && "border-[var(--color-error-500)]"
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
                    Upload Category Image
                </p>
                <p className="text-sm text-[var(--color-neutral-500)]">
                    Click to browse (JPG, PNG, WEBP)
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
    </div>
  );
}

export { FormImageUpload };