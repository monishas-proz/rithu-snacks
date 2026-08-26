"use client";

import * as React from "react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/Toast";
import { useQueryClient } from "@tanstack/react-query";
import { variantKeys, productKeys } from "@/lib/api/query-keys";
import { updateAdminVariant } from "@/features/variants/api/get-variants";
import type { AdminVariantResponse } from "@/features/variants/types";
import { IndianRupee, AlertCircle } from "lucide-react";

interface ProductPriceEditModalProps {
  open: boolean;
  onClose: () => void;
  productUuid: string;
  productName: string;
  variants: AdminVariantResponse[];
  onSuccess?: () => void;
}

interface VariantPriceState {
  basePrice: string;
  salePrice: string;
}

function formatMeasurement(m: any): string {
  if (!m) return "";
  if (typeof m === "string") return m;
  if (typeof m === "object" && "value" in m && "unit" in m) {
    return `${m.value} ${m.unit}`.trim();
  }
  return "";
}

export function ProductPriceEditModal({
  open,
  onClose,
  productUuid,
  productName,
  variants,
  onSuccess,
}: ProductPriceEditModalProps) {
  const queryClient = useQueryClient();
  const [prices, setPrices] = React.useState<Record<string, VariantPriceState>>({});
  const [errors, setErrors] = React.useState<Record<string, { basePrice?: string; salePrice?: string }>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  // Initialize or reset prices when modal opens or variants change
  React.useEffect(() => {
    if (open && variants.length > 0) {
      const initialPrices: Record<string, VariantPriceState> = {};
      variants.forEach((v) => {
        initialPrices[v.id] = {
          basePrice: String(v.basePrice ?? ""),
          salePrice: String(v.salePrice ?? ""),
        };
      });
      setPrices(initialPrices);
      setErrors({});
      setGeneralError(null);
    }
  }, [open, variants]);

  const handlePriceChange = (
    variantId: string,
    field: "basePrice" | "salePrice",
    value: string
  ) => {
    setPrices((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }));

    // Live validation
    const numVal = parseFloat(value);
    let fieldError: string | undefined = undefined;

    if (value.trim() === "") {
      fieldError = "Required";
    } else if (isNaN(numVal)) {
      fieldError = "Invalid number";
    } else if (numVal < 0) {
      fieldError = "Cannot be negative";
    }

    setErrors((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: fieldError,
      },
    }));
  };

  // Determine if any prices have changed
  const changedVariants = React.useMemo(() => {
    return variants.filter((v) => {
      const current = prices[v.id];
      if (!current) return false;
      const newBase = parseFloat(current.basePrice);
      const newSale = parseFloat(current.salePrice);

      const baseChanged = !isNaN(newBase) && newBase !== v.basePrice;
      const saleChanged = !isNaN(newSale) && newSale !== v.salePrice;

      return baseChanged || saleChanged;
    });
  }, [variants, prices]);

  const hasValidationErrors = React.useMemo(() => {
    return Object.values(errors).some(
      (err) => Boolean(err?.basePrice) || Boolean(err?.salePrice)
    );
  }, [errors]);

  const handleSave = async () => {
    setGeneralError(null);

    // Final validation check
    let hasError = false;
    const newErrors: Record<string, { basePrice?: string; salePrice?: string }> = {};

    changedVariants.forEach((v) => {
      const current = prices[v.id];
      const baseNum = parseFloat(current?.basePrice ?? "");
      const saleNum = parseFloat(current?.salePrice ?? "");

      const vErr: { basePrice?: string; salePrice?: string } = {};

      if (!current?.basePrice || isNaN(baseNum) || baseNum < 0) {
        vErr.basePrice = "Must be ≥ 0";
        hasError = true;
      }
      if (!current?.salePrice || isNaN(saleNum) || saleNum < 0) {
        vErr.salePrice = "Must be ≥ 0";
        hasError = true;
      }

      if (vErr.basePrice || vErr.salePrice) {
        newErrors[v.id] = vErr;
      }
    });

    if (hasError) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      setGeneralError("Please fix invalid price values before saving.");
      return;
    }

    if (changedVariants.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      // Concurrently update all modified variants using existing single-variant update API
      const updatePromises = changedVariants.map((v) => {
        const current = prices[v.id];
        const basePrice = parseFloat(current.basePrice);
        const salePrice = parseFloat(current.salePrice);

        return updateAdminVariant(productUuid, v.id, {
          basePrice,
          salePrice,
        });
      });

      await Promise.all(updatePromises);

      // Invalidate relevant query caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: variantKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
      ]);

      toast.success(
        "Prices Updated",
        `Successfully updated prices for ${changedVariants.length} variant${
          changedVariants.length > 1 ? "s" : ""
        }.`
      );

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err?.message || "Failed to update variant prices. Please try again.";
      setGeneralError(errorMsg);
      toast.error("Price Update Failed", errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title="Edit Variant Prices"
      description={`Update prices for all variants of "${productName}".`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-neutral-500 font-mono">
            {changedVariants.length > 0
              ? `${changedVariants.length} of ${variants.length} variant(s) modified`
              : "No changes made yet"}
          </span>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                isSaving ||
                changedVariants.length === 0 ||
                hasValidationErrors
              }
              className="bg-secondary-600 hover:bg-secondary-700 text-white min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" className="mr-2 text-white" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-error-200 bg-error-50 text-sm text-error-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {variants.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            No variants available for this product.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold text-neutral-600 uppercase border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 min-w-[160px]">Variant</th>
                  <th className="px-4 py-3 min-w-[100px]">Current Base</th>
                  <th className="px-4 py-3 min-w-[100px]">Current Sale</th>
                  <th className="px-4 py-3 min-w-[140px]">New Base Price (₹)</th>
                  <th className="px-4 py-3 min-w-[140px]">New Sale Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {variants.map((v) => {
                  const currentPriceState = prices[v.id] || {
                    basePrice: String(v.basePrice),
                    salePrice: String(v.salePrice),
                  };
                  const currentErrors = errors[v.id] || {};
                  const isModified = changedVariants.some((cv) => cv.id === v.id);

                  return (
                    <tr
                      key={v.id}
                      className={isModified ? "bg-amber-50/40 transition-colors" : undefined}
                    >
                      {/* Variant Info */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900 leading-snug">
                              {v.variantName}
                            </span>
                            <Badge
                              variant={v.isActive ? "success" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {v.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span className="font-mono">{v.sku}</span>
                            {formatMeasurement(v.measurement) && (
                              <>
                                <span>•</span>
                                <span>{formatMeasurement(v.measurement)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Current Base Price */}
                      <td className="px-4 py-3 text-neutral-600 font-medium whitespace-nowrap">
                        ₹{v.basePrice.toLocaleString("en-IN")}
                      </td>

                      {/* Current Sale Price */}
                      <td className="px-4 py-3 text-neutral-900 font-semibold whitespace-nowrap">
                        ₹{v.salePrice.toLocaleString("en-IN")}
                      </td>

                      {/* New Base Price Input */}
                      <td className="px-4 py-3">
                        <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <IndianRupee className="h-3.5 w-3.5 text-neutral-400" />
                          </div>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={currentPriceState.basePrice}
                            onChange={(e) =>
                              handlePriceChange(v.id, "basePrice", e.target.value)
                            }
                            disabled={isSaving}
                            className={`block w-full rounded-md border py-1.5 pl-8 pr-2.5 text-sm font-medium outline-none transition-colors ${
                              currentErrors.basePrice
                                ? "border-error-300 focus:border-error-500 focus:ring-1 focus:ring-error-500"
                                : "border-neutral-200 focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600"
                            }`}
                          />
                        </div>
                        {currentErrors.basePrice && (
                          <p className="mt-0.5 text-[11px] text-error-600">
                            {currentErrors.basePrice}
                          </p>
                        )}
                      </td>

                      {/* New Sale Price Input */}
                      <td className="px-4 py-3">
                        <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <IndianRupee className="h-3.5 w-3.5 text-neutral-400" />
                          </div>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={currentPriceState.salePrice}
                            onChange={(e) =>
                              handlePriceChange(v.id, "salePrice", e.target.value)
                            }
                            disabled={isSaving}
                            className={`block w-full rounded-md border py-1.5 pl-8 pr-2.5 text-sm font-medium outline-none transition-colors ${
                              currentErrors.salePrice
                                ? "border-error-300 focus:border-error-500 focus:ring-1 focus:ring-error-500"
                                : "border-neutral-200 focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600"
                            }`}
                          />
                        </div>
                        {currentErrors.salePrice && (
                          <p className="mt-0.5 text-[11px] text-error-600">
                            {currentErrors.salePrice}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FormModal>
  );
}
