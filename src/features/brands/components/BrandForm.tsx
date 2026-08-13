"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrandSchema, updateBrandSchema } from "../validations/brand.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormImageUpload } from "@/components/forms/form-image-upload";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import type { z } from "zod";

type BrandFormData = z.infer<typeof createBrandSchema>;

interface BrandFormProps {
  initialData?: Record<string, unknown>;
  isEditing?: boolean;
  onSubmit: (data: BrandFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function BrandForm({
  initialData,
  isEditing = false,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Brand",
}: BrandFormProps) {
  const methods = useForm<BrandFormData>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: (initialData?.name as string) || "",
      slug: (initialData?.slug as string) || "",
      description: (initialData?.description as string) || "",
      logo: (initialData?.logo as string) || "",
      isActive: (initialData?.isActive as boolean) ?? true,
    },
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit((data) => onSubmit(data))}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="name"
            label="Brand Name"
            placeholder="Enter brand name"
          />

          <FormInput
            name="slug"
            label="Slug"
            placeholder="BRAND_NAME"
          />
        </div>

        <FormTextarea
          name="description"
          label="Description"
          placeholder="Enter brand description"
        />

        <FormImageUpload
          name="logo"
          label="Brand Logo"
        />

        <FormCheckbox
          name="isActive"
          label="Active"
          description="Brand is visible and available for use"
        />

        <div className="flex justify-end pt-4">
          <FormSubmitButton
            isLoading={isLoading}
            className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
          >
            {submitLabel}
          </FormSubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}

export { BrandForm };