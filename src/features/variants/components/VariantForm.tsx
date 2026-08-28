"use client";

import { useMemo, useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getMeasurementFieldConfig,
  calculateWeightGrams,
} from "../utils/measurement.util";
import type { UnitOption } from "../types";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormSubmitButton } from "@/components/forms/form-submit-button";

const variantFormSchema = z.object({
  productId: z
    .string()
    .uuid("Invalid Product UUID format")
    .optional(),
  variantName: z
    .string({ message: "Variant name is required" })
    .trim()
    .min(1, "Variant name cannot be empty")
    .max(100, "Variant name cannot exceed 100 characters"),
  sku: z
    .string({ message: "SKU is required" })
    .trim()
    .min(1, "SKU cannot be empty")
    .max(100, "SKU cannot exceed 100 characters"),
  unitId: z
    .string({ message: "Please select a unit" })
    .uuid("Invalid Unit UUID format")
    .min(1, "Unit is required"),
  unitValue: z
    .number({ message: "Measurement value is required" })
    .gt(0, "Measurement value must be greater than 0"),
  basePrice: z
    .number({ message: "Base price is required" })
    .min(0, "Base price cannot be negative"),
  salePrice: z
    .number({ message: "Sale price is required" })
    .min(0, "Sale price cannot be negative"),
  weightGrams: z
    .number()
    .min(0, "Weight in grams cannot be negative")
    .optional()
    .nullable(),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export interface SelectOption {
  value: string;
  label: string;
}

export type UnitFormItem = UnitOption | (SelectOption & {
  id?: string;
  type?: "weight" | "volume" | "count";
  code?: string;
  name?: string;
  conversionFactor?: number;
});

interface VariantFormProps {
  initialData?: Partial<VariantFormValues>;
  isEditing?: boolean;
  fixedProductId?: string;
  products?: SelectOption[];
  units?: UnitFormItem[];
  onSubmit: (data: VariantFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

function VariantForm({
  initialData,
  isEditing: _isEditing = false,
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

  useEffect(() => {
    if (initialData) {
      methods.reset({
        productId: fixedProductId || initialData.productId || "",
        variantName: initialData.variantName || "",
        sku: initialData.sku || "",
        unitId: initialData.unitId || "",
        unitValue: initialData.unitValue,
        basePrice: initialData.basePrice,
        salePrice: initialData.salePrice,
        weightGrams: initialData.weightGrams ?? null,
      });
    }
  }, [initialData, fixedProductId, methods]);

  const selectedUnitId = useWatch({
    control: methods.control,
    name: "unitId",
  });

  // Find the selected unit object to extract its type, code, name, and conversionFactor
  const selectedUnit = useMemo(() => {
    if (!selectedUnitId) return null;
    return (
      units.find(
        (u) =>
          ("id" in u && u.id === selectedUnitId) ||
          ("value" in u && u.value === selectedUnitId)
      ) || null
    );
  }, [units, selectedUnitId]);

  // Derive dynamic configuration (label, placeholder, helper, badge)
  const measurementConfig = useMemo(() => {
    return getMeasurementFieldConfig(selectedUnit);
  }, [selectedUnit]);

  const productOptions = useMemo(
    () => [{ label: "Select Product", value: "" }, ...products],
    [products]
  );

  const unitOptions = useMemo(() => {
    return [
      { label: "Select Unit", value: "" },
      ...units.map((u) => {
        if ("value" in u && "label" in u) {
          return { value: u.value, label: u.label };
        }
        return {
          value: u.id,
          label: `${u.name} (${u.code})`,
        };
      }),
    ];
  }, [units]);

  const handleFormSubmit = async (data: VariantFormValues) => {
    if (!fixedProductId && !data.productId) {
      methods.setError("productId", { message: "Please select a product" });
      return;
    }

    // Auto-calculate weightGrams for weight units, or set to null for volume/count
    const calculatedWeightGrams = calculateWeightGrams(
      Number(data.unitValue),
      selectedUnit
    );

    const submissionPayload: VariantFormValues = {
      ...data,
      unitValue: Number(data.unitValue),
      basePrice: Number(data.basePrice),
      salePrice: Number(data.salePrice),
      weightGrams: calculatedWeightGrams,
    };

    await onSubmit(submissionPayload);
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
            placeholder="e.g. 500 Grams Pack, 1 Litre Bottle"
          />

          <FormInput
            name="sku"
            label="SKU"
            placeholder="e.g. BANANA-500G, OIL-1L"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <FormSelect
            name="unitId"
            label="Unit"
            placeholder="Select unit"
            options={unitOptions}
          />

          <FormInput
            name="unitValue"
            label={measurementConfig.label}
            placeholder={measurementConfig.placeholder}
            description={measurementConfig.helperText}
            type="number"
            step="any"
            min="0"
            rightIcon={
              measurementConfig.unitBadge ? (
                <span className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">
                  {measurementConfig.unitBadge}
                </span>
              ) : undefined
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

