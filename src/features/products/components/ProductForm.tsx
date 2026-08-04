"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema } from "../validations/product.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import type { z } from "zod";

type ProductFormData = z.infer<typeof createProductSchema>;

interface CategoryOption {
  value: string;
  label: string;
}

interface BrandOption {
  value: string;
  label: string;
}

interface ProductFormProps {
  initialData?: Record<string, unknown>;
  isEditing?: boolean;
  categories: CategoryOption[];
  brands: BrandOption[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function ProductForm({
  initialData,
  isEditing = false,
  categories,
  brands,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const methods = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: (initialData?.name as string) || "",
      slug: (initialData?.slug as string) || "",
      description: (initialData?.description as string) || "",
      shortDescription: (initialData?.shortDescription as string) || "",
      categoryId: (initialData?.categoryId as number) || undefined,
      brandId: (initialData?.brandId as number) || null,
      sku: (initialData?.sku as string) || "",
      price: (initialData?.price as number) || 0,
      comparePrice: (initialData?.comparePrice as number) || null,
      costPrice: (initialData?.costPrice as number) || null,
      taxRate: (initialData?.taxRate as number) || 0,
      discountPercent: (initialData?.discountPercent as number) || 0,
      isActive: (initialData?.isActive as boolean) ?? true,
      isFeatured: (initialData?.isFeatured as boolean) ?? false,
      isDigital: (initialData?.isDigital as boolean) ?? false,
      metaTitle: (initialData?.metaTitle as string) || "",
      metaDescription: (initialData?.metaDescription as string) || "",
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onSubmit(data as ProductFormData))} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="name"
            label="Product Name"
            placeholder="Enter product name"
          />

          <FormInput
            name="slug"
            label="Slug"
            placeholder="product-slug"
          />
        </div>

        <FormTextarea
          name="description"
          label="Description"
          placeholder="Enter product description"
        />

        <FormTextarea
          name="shortDescription"
          label="Short Description"
          placeholder="Brief product summary"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormSelect
            name="categoryId"
            label="Category"
            placeholder="Select category"
            options={categories}
          />

          <FormSelect
            name="brandId"
            label="Brand"
            placeholder="Select brand"
            options={[{ value: "", label: "No Brand" }, ...brands]}
          />

          <FormInput
            name="sku"
            label="SKU"
            placeholder="Product SKU"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FormInput
            name="price"
            label="Price"
            type="number"
            step="0.01"
            placeholder="0.00"
          />

          <FormInput
            name="comparePrice"
            label="Compare Price"
            type="number"
            step="0.01"
            placeholder="0.00"
          />

          <FormInput
            name="taxRate"
            label="Tax Rate (%)"
            type="number"
            step="0.01"
            placeholder="0"
          />

          <FormInput
            name="discountPercent"
            label="Discount (%)"
            type="number"
            step="0.01"
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormCheckbox
            name="isActive"
            label="Active"
            description="Product is visible and available for purchase"
          />

          <FormCheckbox
            name="isFeatured"
            label="Featured"
            description="Show on homepage featured section"
          />

          <FormCheckbox
            name="isDigital"
            label="Digital Product"
            description="This is a digital/downloadable product"
          />
        </div>

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

export { ProductForm };
