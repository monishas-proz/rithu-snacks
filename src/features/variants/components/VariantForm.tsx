"use client";

import React, { useMemo, useEffect, useState, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info, CheckCircle2, XCircle } from "lucide-react";
import { getMeasurementFieldConfig } from "../utils/measurement.util";
import type { UnitOption } from "../types";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { cn } from "@/lib/utils";

const variantFormSchema = z.object({
  productId: z
    .string()
    .uuid("Invalid Product UUID format")
    .optional(),
  variantName: z
    .string({ message: "Item name is required" })
    .trim()
    .min(1, "Item name cannot be empty")
    .max(100, "Item name cannot exceed 100 characters"),
  sku: z
    .string({ message: "SKU is required" })
    .trim()
    .min(1, "SKU cannot be empty")
    .max(100, "SKU cannot exceed 100 characters"),
  slug: z
    .string({ message: "Item code is required" })
    .trim()
    .min(1, "Item code cannot be empty")
    .max(255, "Item code cannot exceed 255 characters"),
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
  inStock: z.boolean(),
  outOfStock: z.boolean().optional(),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export interface SelectOption {
  value: string;
  label: string;
  slug?: string; // Product Code
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
  fixedProductSlug?: string;
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
  fixedProductSlug,
  products = [],
  units = [],
  onSubmit,
  isLoading = false,
  submitLabel = "Save Item",
}: VariantFormProps) {
  const initialInStock =
    initialData?.inStock !== undefined
      ? initialData.inStock
      : initialData?.outOfStock !== undefined
      ? !initialData.outOfStock
      : true;

  // Helper to compute prefix from Product Code / Slug
  const computePrefix = (prodId?: string): string => {
    if (fixedProductSlug) {
      return `${fixedProductSlug.toUpperCase().trim()}_`;
    }
    const p = products.find((item) => item.value === prodId);
    const pSlug = p?.slug?.trim() || "";
    if (pSlug) {
      return `${pSlug.toUpperCase()}_`;
    }
    return "";
  };

  const initialProductId = fixedProductId || initialData?.productId || "";
  const initialPrefix = computePrefix(initialProductId);

  const extractInitialExtraSlug = (fullSlug?: string, prefix?: string): string => {
    if (!fullSlug) return "";
    if (prefix && fullSlug.startsWith(prefix)) {
      return fullSlug.slice(prefix.length);
    }
    return fullSlug.replace(/\s+/g, "_").toUpperCase();
  };

  const [extraSlug, setExtraSlug] = useState<string>(() =>
    extractInitialExtraSlug(initialData?.slug, initialPrefix)
  );
  const [extraSlugError, setExtraSlugError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfo]);

  const methods = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      productId: fixedProductId || initialData?.productId || "",
      variantName: initialData?.variantName || "",
      sku: initialData?.sku || "",
      slug: initialData?.slug || "",
      unitId: initialData?.unitId || "",
      unitValue: initialData?.unitValue,
      basePrice: initialData?.basePrice,
      salePrice: initialData?.salePrice,
      inStock: initialInStock,
      outOfStock: !initialInStock,
    },
  });

  const selectedProductId = methods.watch("productId");

  // Dynamic non-editable prefix based on currently selected Product
  const slugPrefix = useMemo(
    () => computePrefix(selectedProductId || fixedProductId),
    [selectedProductId, fixedProductId, fixedProductSlug, products]
  );

  // Sync combined variant code into form state whenever prefix or extraSlug updates
  useEffect(() => {
    const fullSlug = `${slugPrefix}${extraSlug}`.trim();
    methods.setValue("slug", fullSlug, {
      shouldValidate: methods.formState.isSubmitted,
    });
  }, [slugPrefix, extraSlug, methods]);

  useEffect(() => {
    if (initialData) {
      const isStock =
        initialData.inStock !== undefined
          ? initialData.inStock
          : initialData.outOfStock !== undefined
          ? !initialData.outOfStock
          : true;

      methods.reset({
        productId: fixedProductId || initialData.productId || "",
        variantName: initialData.variantName || "",
        sku: initialData.sku || "",
        slug: initialData.slug || "",
        unitId: initialData.unitId || "",
        unitValue: initialData.unitValue,
        basePrice: initialData.basePrice,
        salePrice: initialData.salePrice,
        inStock: isStock,
        outOfStock: !isStock,
      });

      setExtraSlug(extractInitialExtraSlug(initialData.slug, initialPrefix));
    }
  }, [initialData, fixedProductId, initialPrefix, methods]);

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
    () => products,
    [products]
  );

  const unitOptions = useMemo(() => {
    return units.map((u) => {
      if ("value" in u && "label" in u) {
        return { value: u.value, label: u.label };
      }
      return {
        value: u.id,
        label: `${u.name} (${u.code})`,
      };
    });
  }, [units]);

  const handleExtraSlugChange = (raw: string) => {
    // Format variant code: uppercase, convert spaces to underscore, allow special characters
    const formatted = raw
      .toUpperCase()
      .replace(/\s+/g, "_");
    setExtraSlug(formatted);
    if (extraSlugError) setExtraSlugError(null);
    methods.clearErrors("slug");
  };

  const handleFormSubmit = async (data: VariantFormValues) => {
    if (!fixedProductId && !data.productId) {
      methods.setError("productId", { message: "Please select a product" });
      return;
    }

    if (!extraSlug.trim()) {
      const msg = "Please enter the Item code (cannot be empty)";
      setExtraSlugError(msg);
      methods.setError("slug", {
        type: "manual",
        message: msg,
      });
      return;
    }

    const inStockVal = methods.getValues("inStock") ?? true;
    const finalSlug = `${slugPrefix}${extraSlug.trim()}`;

    const submissionPayload: VariantFormValues = {
      ...data,
      slug: finalSlug,
      unitValue: Number(data.unitValue),
      basePrice: Number(data.basePrice),
      salePrice: Number(data.salePrice),
      inStock: Boolean(inStockVal),
      outOfStock: !inStockVal,
    };

    await onSubmit(submissionPayload);
  };

  const currentInStock = methods.watch("inStock") ?? true;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Row 1: Product & Variant Name (or Variant Name & SKU if product is fixed) */}
        {!fixedProductId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              name="productId"
              label="Product"
              placeholder="Select product"
              options={productOptions}
              required
            />

            <FormInput
              name="variantName"
              label="Item Name"
              placeholder="e.g. 500 Grams Pack, 1 Litre Bottle"
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="variantName"
              label="Item Name"
              placeholder="e.g. 500 Grams Pack, 1 Litre Bottle"
              required
            />

            <FormInput
              name="sku"
              label="SKU"
              placeholder="e.g. BANANA-500G, OIL-1L"
              required
            />
          </div>
        )}

        {/* Row 2: Variant Code (Full Width) with Category + Product Code Prefix & Floating Info Pop-Up */}
        <div className="pt-0 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="block text-xs font-semibold text-[var(--color-neutral-800)]">
              Item Code <span className="text-red-500">*</span>
            </label>
            <div className="relative inline-flex items-center" ref={infoRef}>
              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                className="text-neutral-400 hover:text-[var(--color-secondary-600)] transition-colors focus:outline-none cursor-pointer rounded-full p-0.5"
                title="Click for more information"
                aria-label="Information"
              >
                <Info className="h-3.5 w-3.5" />
              </button>

              {showInfo && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl bg-white border border-neutral-200/90 p-3 text-xs text-neutral-700 shadow-xl shadow-neutral-900/10 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-[var(--color-secondary-600)] shrink-0 mt-0.5" />
                      <p className="leading-relaxed text-[var(--color-neutral-800)]">
                        Enter Item code (special characters allowed, e.g. 500G or PACK_OF_2). Category & Product code prefix is automatically applied.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInfo(false)}
                      className="text-neutral-400 hover:text-neutral-700 font-bold text-sm leading-none ml-1 p-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex items-stretch rounded-lg border transition-all ${
              extraSlugError || methods.formState.errors.slug
                ? "border-red-500 ring-2 ring-red-500/10"
                : "border-neutral-200 focus-within:border-secondary-600 focus-within:ring-2 focus-within:ring-secondary-600/20"
            } bg-white overflow-hidden`}
          >
            {/* Non-editable Category + Product Code prefix */}
            <div
              className="flex items-center px-3 bg-neutral-100/90 border-r border-neutral-200 text-neutral-600 font-mono text-xs select-none max-w-[60%] shrink-0 truncate"
              title={
                slugPrefix
                  ? `Product Prefix: ${slugPrefix}`
                  : "Select Product to auto-generate prefix"
              }
            >
              {slugPrefix ? (
                <span className="font-semibold text-neutral-800 tracking-wide truncate">
                  {slugPrefix}
                </span>
              ) : (
                <span className="text-neutral-400 italic text-[11px]">
                  [category_product_code]_
                </span>
              )}
            </div>

            {/* Editable extra code for the variant */}
            <input
              type="text"
              value={extraSlug}
              onChange={(e) => handleExtraSlugChange(e.target.value)}
              placeholder="e.g. 500G"
              className="flex-1 min-w-0 px-3 py-2 text-sm text-neutral-900 bg-transparent outline-none font-mono placeholder:text-neutral-400 placeholder:font-sans uppercase"
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
                <span className="font-sans font-medium text-neutral-600">Full Code:</span>
                {slugPrefix || extraSlug ? (
                  <span className="text-secondary-700 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    {slugPrefix}
                    <span className={extraSlug ? "text-secondary-800 font-bold" : "text-neutral-400 italic font-normal"}>
                      {extraSlug || "ENTER_ITEM_CODE"}
                    </span>
                  </span>
                ) : (
                  <span className="text-neutral-400 italic font-sans">
                    Select product to generate prefix
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: SKU & Unit (when not fixed) OR Unit & Measurement Value (when fixed) */}
        {!fixedProductId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="sku"
              label="SKU"
              placeholder="e.g. BANANA-500G, OIL-1L"
              required
            />

            <FormSelect
              name="unitId"
              label="Unit"
              placeholder="Select unit"
              options={unitOptions}
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <FormSelect
              name="unitId"
              label="Unit"
              placeholder="Select unit"
              options={unitOptions}
              required
            />

            <FormInput
              name="unitValue"
              label={measurementConfig.label}
              placeholder={measurementConfig.placeholder}
              description={measurementConfig.helperText}
              type="number"
              step="any"
              min="0"
              required
              rightIcon={
                measurementConfig.unitBadge ? (
                  <span className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">
                    {measurementConfig.unitBadge}
                  </span>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Row 4: Measurement Value & Base Price (when not fixed) OR Base Price & Sale Price (when fixed) */}
        {!fixedProductId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <FormInput
              name="unitValue"
              label={measurementConfig.label}
              placeholder={measurementConfig.placeholder}
              description={measurementConfig.helperText}
              type="number"
              step="any"
              min="0"
              required
              rightIcon={
                measurementConfig.unitBadge ? (
                  <span className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">
                    {measurementConfig.unitBadge}
                  </span>
                ) : undefined
              }
            />

            <FormInput
              name="basePrice"
              label="Base Price (MRP ₹)"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 260"
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="basePrice"
              label="Base Price (MRP ₹)"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 260"
              required
            />

            <FormInput
              name="salePrice"
              label="Sale Price (₹)"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 230"
              required
            />
          </div>
        )}

        {/* Row 5: Sale Price (only when not fixed product, since it has an extra product field on row 1) */}
        {!fixedProductId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="salePrice"
              label="Sale Price (₹)"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 230"
              required
            />
          </div>
        )}

        {/* Stock Availability Toggle Card */}
        <div className="p-4 rounded-2xl border border-cream-border bg-cream-50/70 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900">Stock Availability</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs",
                  currentInStock
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                )}
              >
                {currentInStock ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>In Stock</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Out of Stock</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              {currentInStock
                ? "This Item is in stock and available for customers to order on the store."
                : "This Item is marked as out of stock. Customers will see 'Out of Stock'."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(currentInStock)}
            onClick={() =>
              methods.setValue("inStock", !currentInStock, {
                shouldDirty: true,
              })
            }
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              currentInStock ? "bg-emerald-600" : "bg-neutral-300"
            )}
            title={currentInStock ? "Click to set Out of Stock" : "Click to set In Stock"}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                currentInStock ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <div className="flex justify-end pt-2">
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
