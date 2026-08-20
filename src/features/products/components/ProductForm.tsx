"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { vegTypeEnum, type VegType } from "../validations/admin-product.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormSubmitButton } from "@/components/forms/form-submit-button";

const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name cannot exceed 200 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Product slug is required")
    .max(220, "Product slug cannot exceed 220 characters"),
  categoryId: z
    .string()
    .min(1, "Please select a category"),
  brandId: z
    .string()
    .min(1, "Please select a brand"),
  hsnCodeId: z
    .string()
    .min(1, "Please select an HSN code"),
  vegType: vegTypeEnum,
  isFeatured: z.boolean().default(false),
  shortDescription: z
    .string()
    .trim()
    .max(500, "Short description cannot exceed 500 characters")
    .optional(),
  description: z.string().trim().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductOption {
  value: string;
  label: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormValues>;
  isEditing?: boolean;
  categories: ProductOption[];
  brands: ProductOption[];
  hsnCodes: ProductOption[];
  onSubmit: (data: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

const vegTypeOptions = [
  { label: "Vegetarian (Veg)", value: "veg" },
  { label: "Non-Vegetarian (Non-Veg)", value: "nonveg" },
  { label: "Vegan", value: "vegan" },
  { label: "Not Applicable (N/A)", value: "na" },
];

function ProductForm({
  initialData,
  isEditing = false,
  categories = [],
  brands = [],
  hsnCodes = [],
  onSubmit,
  isLoading = false,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      categoryId: initialData?.categoryId || "",
      brandId: initialData?.brandId || "",
      hsnCodeId: initialData?.hsnCodeId || "",
      vegType: initialData?.vegType || "veg",
      isFeatured: initialData?.isFeatured ?? false,
      shortDescription: initialData?.shortDescription || "",
      description: initialData?.description || "",
    },
  });

  const categoryOptions = [
    { label: "Select Category", value: "" },
    ...categories,
  ];

  const brandOptions = [
    { label: "Select Brand", value: "" },
    ...brands,
  ];

  const hsnCodeOptions = [
    { label: "Select HSN Code", value: "" },
    ...hsnCodes,
  ];

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(async (data) => {
          await onSubmit(data);
        })}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="name"
            label="Product Name"
            placeholder="e.g. Banana Chips"
          />

          <FormInput
            name="slug"
            label="Product Slug"
            placeholder="e.g. BANANA_CHIPS"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormSelect
            name="categoryId"
            label="Category"
            placeholder="Select category"
            options={categoryOptions}
          />

          <FormSelect
            name="brandId"
            label="Brand"
            placeholder="Select brand"
            options={brandOptions}
          />

          <FormSelect
            name="hsnCodeId"
            label="HSN Code"
            placeholder="Select HSN code"
            options={hsnCodeOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <FormSelect
            name="vegType"
            label="Dietary Type"
            placeholder="Select dietary type"
            options={vegTypeOptions}
          />

          <div className="pt-6">
            <FormCheckbox
              name="isFeatured"
              label="Featured Product"
              description="Display this product prominently in featured sections"
            />
          </div>
        </div>

        <FormTextarea
          name="shortDescription"
          label="Short Description"
          placeholder="Brief summary of the product (max 500 characters)"
          rows={2}
        />

        <FormTextarea
          name="description"
          label="Description"
          placeholder="Detailed product information and description"
          rows={4}
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

export { ProductForm };
