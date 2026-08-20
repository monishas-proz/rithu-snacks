"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createAdminVariantSchema,
  updateAdminVariantSchema,
  type CreateAdminVariantInput,
  type UpdateAdminVariantInput,
} from "../validations/admin-variant.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormSubmitButton } from "@/components/forms/form-submit-button";

const variantFormSchema = z.object({
  productId: z
    .string()
    .uuid("Invalid Product UUID format")
    .optional(),
  variantName: createAdminVariantSchema.shape.variantName,
  sku: createAdminVariantSchema.shape.sku,
  unitId: createAdminVariantSchema.shape.unitId,
  unitValue: createAdminVariantSchema.shape.unitValue,
  basePrice: createAdminVariantSchema.shape.basePrice,
  salePrice: createAdminVariantSchema.shape.salePrice,
  weightGrams: createAdminVariantSchema.shape.weightGrams,
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export interface SelectOption {
  value: string;
  label: string;
}

interface VariantFormProps {
  initialData?: Partial<VariantFormValues>;
  isEditing?: boolean;
  fixedProductId?: string;
  products?: SelectOption[];
  units?: SelectOption[];
  onSubmit: (data: VariantFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function VariantForm({
  initialData,
  isEditing = false,
  fixedProductId,
  products = [],
  units = [],
  onSubmit,
  isLoading = false,
  submitLabel = "Save Variant",
}: VariantFormProps) {
  const methods = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      productId: fixedProductId || initialData?.productId || "",
      variantName: initialData?.variantName || "",
      sku: initialData?.sku || "",
      unitId: initialData?.unitId || "",
      unitValue: initialData?.unitValue,
      basePrice: initialData?.basePrice,
      salePrice: initialData?.salePrice,
      weightGrams: initialData?.weightGrams ?? null,
    },
  });

  const productOptions = [
    { label: "Select Product", value: "" },
    ...products,
  ];

  const unitOptions = [
    { label: "Select Unit", value: "" },
    ...units,
  ];

  const handleFormSubmit = async (data: VariantFormValues) => {
    if (!fixedProductId && !data.productId) {
      methods.setError("productId", { message: "Please select a product" });
      return;
    }
    await onSubmit(data);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {!fixedProductId && (
          <FormSelect
            name="productId"
            label="Product"
            placeholder="Select product"
            options={productOptions}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="variantName"
            label="Variant Name"
            placeholder="e.g. 500 Grams Pack, 1 kg"
          />

          <FormInput
            name="sku"
            label="SKU"
            placeholder="e.g. BANANA-500G"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormSelect
            name="unitId"
            label="Unit"
            placeholder="Select unit"
            options={unitOptions}
          />

          <FormInput
            name="unitValue"
            label="Unit Value"
            type="number"
            step="any"
            placeholder="e.g. 500, 1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormInput
            name="basePrice"
            label="Base Price (MRP ₹)"
            type="number"
            step="any"
            min="0"
            placeholder="e.g. 260"
          />

          <FormInput
            name="salePrice"
            label="Sale Price (₹)"
            type="number"
            step="any"
            min="0"
            placeholder="e.g. 230"
          />

          <FormInput
            name="weightGrams"
            label="Weight (in Grams)"
            type="number"
            step="any"
            min="0"
            placeholder="e.g. 500"
          />
        </div>

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

export { VariantForm };
