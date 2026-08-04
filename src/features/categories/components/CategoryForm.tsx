"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema } from "../validations/category.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import type { z } from "zod";

type CategoryFormData = z.infer<typeof createCategorySchema>;

interface ParentCategoryOption {
  value: string;
  label: string;
}

interface CategoryFormProps {
  initialData?: Record<string, unknown>;
  isEditing?: boolean;
  parentCategories: ParentCategoryOption[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function CategoryForm({
  initialData,
  isEditing = false,
  parentCategories,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Category",
}: CategoryFormProps) {
  const methods = useForm({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: (initialData?.name as string) || "",
      slug: (initialData?.slug as string) || "",
      description: (initialData?.description as string) || "",
      image: (initialData?.image as string) || "",
      parentId: (initialData?.parentId as number) || null,
      isActive: (initialData?.isActive as boolean) ?? true,
      sortOrder: (initialData?.sortOrder as number) || 0,
      metaTitle: (initialData?.metaTitle as string) || "",
      metaDescription: (initialData?.metaDescription as string) || "",
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onSubmit(data as CategoryFormData))} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="name"
            label="Category Name"
            placeholder="Enter category name"
          />

          <FormInput
            name="slug"
            label="Slug"
            placeholder="category-slug"
          />
        </div>

        <FormTextarea
          name="description"
          label="Description"
          placeholder="Enter category description"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormInput
            name="image"
            label="Image URL"
            placeholder="https://example.com/image.jpg"
          />

          <FormSelect
            name="parentId"
            label="Parent Category"
            placeholder="None (Top Level)"
            options={[{ value: "", label: "None (Top Level)" }, ...parentCategories]}
          />

          <FormInput
            name="sortOrder"
            label="Sort Order"
            type="number"
            placeholder="0"
          />
        </div>

        <FormCheckbox
          name="isActive"
          label="Active"
          description="Category is visible and available for use"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="metaTitle"
            label="Meta Title"
            placeholder="SEO meta title"
          />

          <FormInput
            name="metaDescription"
            label="Meta Description"
            placeholder="SEO meta description"
          />
        </div>

        <FormSubmitButton isLoading={isLoading}>
          {submitLabel}
        </FormSubmitButton>
      </form>
    </FormProvider>
  );
}

export { CategoryForm };
