"use client";

import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormImageUpload } from "@/components/forms/form-image-upload";
import { FormVideoUpload } from "@/components/forms/form-video-upload";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import type { BannerDto } from "../types";

const bannerFormSchema = z.object({
  bannerPositionId: z
    .string({ message: "Banner position is required" })
    .min(1, "Please select a banner position"),
  title: z
    .string()
    .trim()
    .max(150, "Title cannot exceed 150 characters")
    .optional()
    .nullable(),
  mediaType: z.enum(["image", "video"]).default("image"),
  imageUrl: z
    .string({ message: "Banner image is required" })
    .min(1, "Banner image is required"),
  videoUrl: z.string().optional().nullable(),
  linkUrl: z
    .string()
    .trim()
    .max(500, "Link URL cannot exceed 500 characters")
    .optional()
    .nullable(),
  sortOrder: z.coerce
    .number()
    .int("Sort order must be an integer")
    .min(0, "Sort order cannot be negative")
    .max(100, "Sort order cannot exceed 100")
    .default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
}).refine((data) => data.mediaType !== "video" || Boolean(data.videoUrl), {
  message: "Please upload a video",
  path: ["videoUrl"],
});

export type BannerFormData = z.infer<typeof bannerFormSchema>;

interface BannerPositionOption {
  value: string;
  label: string;
}

interface BannerFormProps {
  initialData?: Partial<BannerDto> | null;
  bannerPositions: BannerPositionOption[];
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function BannerForm({
  initialData,
  bannerPositions,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Banner",
}: BannerFormProps) {
  const formatDateForInput = (dateVal: unknown): string => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal as string | Date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const getFormDefaults = React.useCallback(() => {
    return {
      bannerPositionId: initialData?.bannerPosition?.id || "",
      title: initialData?.title || "",
      mediaType: initialData?.mediaType || "image",
      imageUrl: initialData?.imageUrl || "",
      videoUrl: initialData?.videoUrl || "",
      linkUrl: initialData?.linkUrl || "",
      sortOrder: initialData?.sortOrder ?? 0,
      isActive: initialData?.isActive ?? true,
      startsAt: formatDateForInput(initialData?.startsAt),
      endsAt: formatDateForInput(initialData?.endsAt),
    };
  }, [initialData]);

  const methods = useForm<BannerFormData>({
    resolver: zodResolver(bannerFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: getFormDefaults(),
  });

  useEffect(() => {
    methods.reset(getFormDefaults());
  }, [getFormDefaults, methods]);

  const handleFormSubmit = async (values: BannerFormData) => {
    const payload: Record<string, unknown> = {
      bannerPositionId: values.bannerPositionId,
      mediaType: values.mediaType,
      imageUrl: values.imageUrl,
      videoUrl:
        values.mediaType === "video" && values.videoUrl?.trim()
          ? values.videoUrl.trim()
          : null,
      sortOrder: Number(values.sortOrder) || 0,
      isActive: Boolean(values.isActive),
      title: values.title && values.title.trim() ? values.title.trim() : null,
      linkUrl:
        values.linkUrl && values.linkUrl.trim()
          ? values.linkUrl.trim()
          : null,
      startsAt:
        values.startsAt && values.startsAt.trim()
          ? new Date(values.startsAt).toISOString()
          : null,
      endsAt:
        values.endsAt && values.endsAt.trim()
          ? new Date(values.endsAt).toISOString()
          : null,
    };

    await onSubmit(payload);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Banner Position and Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormSelect
            name="bannerPositionId"
            label="Banner Position"
            placeholder="Select display position"
            options={bannerPositions}
            required
          />

          <FormInput
            name="title"
            label="Banner Title"
            placeholder="e.g. Diwali Special Offer"
          />
        </div>

        {/* Media Type Toggle */}
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-1.5 w-fit">
          {(["image", "video"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => methods.setValue("mediaType", type, { shouldValidate: true })}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors cursor-pointer ${
                methods.watch("mediaType") === type
                  ? "bg-[var(--color-secondary-600)] text-white"
                  : "text-[var(--color-neutral-600)] hover:bg-white"
              }`}
            >
              {type === "video" ? "Video (Reel)" : "Image"}
            </button>
          ))}
        </div>

        {methods.watch("mediaType") === "video" ? (
          <>
            <FormVideoUpload
              name="videoUrl"
              label="Reel Video (9:16 Portrait)"
              folder="banners"
              required
            />
            <FormImageUpload
              name="imageUrl"
              label="Video Thumbnail / Poster (9:16 Aspect Ratio)"
              folder="banners"
              cropWidth={720}
              cropHeight={1280}
              aspectRatioClassName="aspect-[9/16] w-40 max-h-64 mx-auto"
              enableCrop={true}
              required
            />
          </>
        ) : (
          <FormImageUpload
            name="imageUrl"
            label="Banner Image (3:1 Aspect Ratio)"
            folder="banners"
            cropWidth={1200}
            cropHeight={400}
            aspectRatioClassName="aspect-[3/1] w-full max-h-56"
            enableCrop={true}
            required
          />
        )}

        {/* Link URL and Sort Order */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <FormInput
              name="linkUrl"
              label="Target Link URL"
              placeholder="e.g. /products/diwali-special"
            />
          </div>

          <FormInput
            name="sortOrder"
            type="number"
            label="Sort Order"
            step="1"
            min="0"
            max="100"
            placeholder="0"
          />
        </div>

        {/* Scheduling: Starts At & Ends At */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormInput
            name="startsAt"
            type="datetime-local"
            label="Starts At (Optional)"
          />

          <FormInput
            name="endsAt"
            type="datetime-local"
            label="Ends At (Optional)"
          />
        </div>

        {/* Active Toggle Switch */}
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-neutral-900)]">
              Active Status
            </p>
            <p className="text-xs text-[var(--color-neutral-500)]">
              Enable or disable banner visibility on the storefront
            </p>
          </div>
          <FormSwitch
            checked={methods.watch("isActive")}
            onCheckedChange={(val) => methods.setValue("isActive", val)}
          />
        </div>

        <div className="flex justify-end pt-4">
          <FormSubmitButton
            isLoading={isLoading}
            className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)] cursor-pointer"
          >
            {submitLabel}
          </FormSubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}
