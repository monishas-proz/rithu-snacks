"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  isFeatured: z.boolean(),
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
  slug?: string;
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
  // Helper to compute prefix from brand slug and category slug
  const computePrefix = (brandVal?: string, catVal?: string): string => {
    const b = brands.find((item) => item.value === brandVal);
    const c = categories.find((item) => item.value === catVal);
    const bSlug = b?.slug?.trim() || "";
    const cSlug = c?.slug?.trim() || "";

    if (bSlug && cSlug) {
      return `${bSlug}-${cSlug}-`;
    }
    if (bSlug) {
      return `${bSlug}-`;
    }
    if (cSlug) {
      return `${cSlug}-`;
    }
    return "";
  };

  const initialBrandId = initialData?.brandId || "";
  const initialCatId = initialData?.categoryId || "";
  const initialPrefix = computePrefix(initialBrandId, initialCatId);

  const extractInitialExtraSlug = (fullSlug?: string, prefix?: string): string => {
    if (!fullSlug) return "";
    if (prefix && fullSlug.startsWith(prefix)) {
      return fullSlug.slice(prefix.length);
    }
    return fullSlug;
  };

  const [extraSlug, setExtraSlug] = useState<string>(() =>
    extractInitialExtraSlug(initialData?.slug, initialPrefix)
  );
  const [extraSlugError, setExtraSlugError] = useState<string | null>(null);

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

  const selectedBrandId = methods.watch("brandId");
  const selectedCategoryId = methods.watch("categoryId");

  // Dynamic non-editable prefix based on currently selected Brand and Category
  const slugPrefix = useMemo(
    () => computePrefix(selectedBrandId, selectedCategoryId),
    [selectedBrandId, selectedCategoryId, brands, categories]
  );

  // Sync combined slug into form state whenever prefix or extraSlug updates
  useEffect(() => {
    const fullSlug = `${slugPrefix}${extraSlug}`.trim();
    methods.setValue("slug", fullSlug, {
      shouldValidate: methods.formState.isSubmitted,
    });
  }, [slugPrefix, extraSlug, methods]);

  const handleExtraSlugChange = (raw: string) => {
    // Format slug characters: keep alphanumeric, hyphens, underscores, replace spaces with hyphen
    const formatted = raw
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    setExtraSlug(formatted);
    if (extraSlugError) setExtraSlugError(null);
    methods.clearErrors("slug");
  };

  const handleFormSubmit = async (formData: ProductFormValues) => {
    // 1. Validate brand selection
    if (!formData.brandId) {
      methods.setError("brandId", { message: "Please select a brand" });
      return;
    }

    // 2. Validate category selection
    if (!formData.categoryId) {
      methods.setError("categoryId", { message: "Please select a category" });
      return;
    }

    // 3. Admin must add an extra slug for the product (cannot be empty)
    if (!extraSlug.trim()) {
      const msg = "Please enter an additional slug for the product (cannot be empty)";
      setExtraSlugError(msg);
      methods.setError("slug", {
        type: "manual",
        message: msg,
      });
      return;
    }

    const finalSlug = `${slugPrefix}${extraSlug.trim()}`;
    await onSubmit({
      ...formData,
      slug: finalSlug,
    });
  };

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
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="name"
            label="Product Name"
            placeholder="e.g. Banana Chips"
          />

          <FormSelect
            name="brandId"
            label="Brand"
            placeholder="Select brand"
            options={brandOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSelect
            name="categoryId"
            label="Category"
            placeholder="Select category"
            options={categoryOptions}
          />

          <FormSelect
            name="hsnCodeId"
            label="HSN Code"
            placeholder="Select HSN code"
            options={hsnCodeOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Custom Product Slug Field with Non-Editable Prefix and Editable Extra Slug */}
          <div className="pt-0 mb-3">
            <label className="block text-xs font-semibold text-[var(--color-neutral-800)] mb-1">
              Product Slug <span className="text-red-500">*</span>
            </label>

            <div
              className={`flex items-stretch rounded-lg border transition-all ${
                extraSlugError || methods.formState.errors.slug
                  ? "border-red-500 ring-2 ring-red-500/10"
                  : "border-neutral-200 focus-within:border-secondary-600 focus-within:ring-2 focus-within:ring-secondary-600/20"
              } bg-white overflow-hidden`}
            >
              {/* Non-editable prefix (Brand Slug + Category Slug) */}
              <div
                className="flex items-center px-3 bg-neutral-100/90 border-r border-neutral-200 text-neutral-600 font-mono text-xs select-none max-w-[60%] shrink-0 truncate"
                title={
                  slugPrefix
                    ? `Fixed Prefix: ${slugPrefix}`
                    : "Select Brand & Category to auto-generate prefix"
                }
              >
                {slugPrefix ? (
                  <span className="font-semibold text-neutral-800 tracking-wide truncate">
                    {slugPrefix}
                  </span>
                ) : (
                  <span className="text-neutral-400 italic text-[11px]">
                    [brand]-[category]-
                  </span>
                )}
              </div>

              {/* Editable extra slug for the product */}
              <input
                type="text"
                value={extraSlug}
                onChange={(e) => handleExtraSlugChange(e.target.value)}
                placeholder="e.g. banana-chips"
                className="flex-1 min-w-0 px-3 py-2 text-sm text-neutral-900 bg-transparent outline-none font-mono placeholder:text-neutral-400 placeholder:font-sans"
              />
            </div>

            {/* Helper message / live preview / error */}
            <div className="mt-1.5 min-h-[18px]">
              {extraSlugError || methods.formState.errors.slug?.message ? (
                <p className="text-xs text-red-500 font-medium">
                  {extraSlugError || methods.formState.errors.slug?.message}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1 flex-wrap">
                  <span className="font-sans font-medium text-neutral-600">Full Slug:</span>
                  {slugPrefix || extraSlug ? (
                    <span className="text-secondary-700 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                      {slugPrefix}
                      <span className={extraSlug ? "text-secondary-800 font-bold" : "text-neutral-400 italic font-normal"}>
                        {extraSlug || "enter-extra-slug"}
                      </span>
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic font-sans">
                      Select brand and category to generate prefix
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <FormSelect
            name="vegType"
            label="Dietary Type"
            placeholder="Select dietary type"
            options={vegTypeOptions}
          />
        </div>

        <FormCheckbox
          name="isFeatured"
          label="Featured Product"
          description="Display this product prominently in featured sections"
        />

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
