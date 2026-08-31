"use client";

import * as React from "react";
import Image from "next/image";
import {
  IndianRupee,
  AlertCircle,
  Percent,
  RotateCcw,
  Sparkles,
  Search,
  Package,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { FormModal } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/Toast";
import { useQueryClient } from "@tanstack/react-query";
import { variantKeys, productKeys } from "@/lib/api/query-keys";
import { useBulkEditVariants } from "@/features/variants/hooks";
import type { AdminVariantResponse } from "@/features/variants/types";

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
  const bulkEditMutation = useBulkEditVariants();

  const [prices, setPrices] = React.useState<Record<string, VariantPriceState>>({});
  const [errors, setErrors] = React.useState<Record<string, { basePrice?: string; salePrice?: string }>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [customDiscount, setCustomDiscount] = React.useState<string>("");

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
      setSearchQuery("");
      setCustomDiscount("");
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
      fieldError = "Must be ≥ 0";
    }

    setErrors((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: fieldError,
      },
    }));
  };

  // Batch action: Apply percentage discount to base price across all variants
  const handleApplyDiscountToAll = (percent: number) => {
    if (percent < 0 || percent > 100) return;
    setPrices((prev) => {
      const next = { ...prev };
      variants.forEach((v) => {
        const base = parseFloat(next[v.id]?.basePrice ?? String(v.basePrice));
        if (!isNaN(base) && base > 0) {
          const discountMultiplier = (100 - percent) / 100;
          const newSale = Math.round(base * discountMultiplier);
          next[v.id] = {
            basePrice: String(base),
            salePrice: String(newSale),
          };
        }
      });
      return next;
    });

    // Clear sale errors
    setErrors((prev) => {
      const next = { ...prev };
      variants.forEach((v) => {
        if (next[v.id]) {
          next[v.id] = { ...next[v.id], salePrice: undefined };
        }
      });
      return next;
    });

    toast.info("Discount Applied", `Applied ${percent}% discount across all variants.`);
  };

  // Batch action: Reset all prices to original values
  const handleResetToOriginal = () => {
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
    toast.info("Prices Reset", "Restored original variant prices.");
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

  // Filtered variants for search inside modal
  const filteredVariants = React.useMemo(() => {
    if (!searchQuery.trim()) return variants;
    const q = searchQuery.toLowerCase().trim();
    return variants.filter(
      (v) =>
        v.variantName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        formatMeasurement(v.measurement).toLowerCase().includes(q)
    );
  }, [variants, searchQuery]);

  // Bulk Save handler calling PUT /api/admin/variants/bulk
  const handleSave = async () => {
    setGeneralError(null);

    // Final validation check on all modified variants
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

    // Format payload for PUT /api/admin/variants/bulk
    const bulkPayload = {
      variants: changedVariants.map((v) => {
        const current = prices[v.id];
        return {
          id: v.id,
          basePrice: parseFloat(current.basePrice),
          salePrice: parseFloat(current.salePrice),
        };
      }),
    };

    try {
      await bulkEditMutation.mutateAsync(bulkPayload);

      // Invalidate relevant query caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: variantKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
      ]);

      toast.success(
        "Prices Updated",
        `Successfully updated prices for ${changedVariants.length} variant${
          changedVariants.length > 1 ? "s" : ""
        } in bulk.`
      );

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err?.message || "Failed to update variant prices. Please try again.";
      setGeneralError(errorMsg);
      toast.error("Bulk Price Update Failed", errorMsg);
    }
  };

  const isSaving = bulkEditMutation.isPending;

  return (
    <FormModal
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title="Edit Variant Prices"
      description={`Bulk update Base MRP and Sale prices for all variants of "${productName}".`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                changedVariants.length > 0
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {changedVariants.length} of {variants.length} variant(s) modified
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-semibold"
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
              className="bg-secondary-600 hover:bg-secondary-700 text-white min-w-[130px] text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" className="mr-2 text-white" />
                  Saving in bulk...
                </>
              ) : (
                `Save ${changedVariants.length > 0 ? `(${changedVariants.length})` : ""} Changes`
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* General Error Banner */}
        {generalError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Quick Actions & Batch Discount Toolbar */}
        {/* <div className="rounded-xl bg-cream-100 p-3 sm:p-3.5 border border-cream-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-secondary-600" />
              <span>Quick Discount:</span>
            </span>

            {[5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleApplyDiscountToAll(pct)}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-cream-border text-neutral-700 hover:bg-secondary-50 hover:text-secondary-700 hover:border-secondary-300 transition-all shadow-2xs cursor-pointer"
              >
                {pct}% Off MRP
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleApplyDiscountToAll(0)}
              disabled={isSaving}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-cream-border text-neutral-600 hover:bg-neutral-100 transition-all shadow-2xs cursor-pointer"
              title="Set sale price equal to base price"
            >
              0% (MRP Only)
            </button>
          </div>

          
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-cream-border shadow-2xs">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Custom %"
                value={customDiscount}
                onChange={(e) => setCustomDiscount(e.target.value)}
                className="w-18 text-xs font-semibold outline-none text-neutral-800 placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => {
                  const num = parseFloat(customDiscount);
                  if (!isNaN(num) && num >= 0 && num <= 100) {
                    handleApplyDiscountToAll(num);
                    setCustomDiscount("");
                  }
                }}
                disabled={!customDiscount || isSaving}
                className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-secondary-600 text-white disabled:opacity-40 cursor-pointer"
              >
                Apply
              </button>
            </div>

            {changedVariants.length > 0 && (
              <button
                type="button"
                onClick={handleResetToOriginal}
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-600 bg-white border border-cream-border hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
                title="Reset all prices to initial state"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div> */}

        {/* Search inside modal (if > 3 variants) */}
        {variants.length > 3 && (
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter variants by name, SKU or size..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-cream-border text-xs bg-cream-50/50 focus:bg-white focus:outline-none focus:border-secondary-600 transition-colors"
            />
          </div>
        )}

        {/* Variants Price Table */}
        {variants.length === 0 ? (
          <div className="text-center py-10 text-neutral-400 text-xs">
            No variants available for this product.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-cream-border max-h-[420px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-cream-50 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-cream-border shadow-[0_1px_0_var(--cream-border)]">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Variant</th>
                  <th className="px-4 py-3 min-w-[90px] text-right">Current base</th>
                  <th className="px-4 py-3 min-w-[90px] text-right">Current Sale</th>
                  <th className="px-4 py-3 min-w-[130px]">New Base (₹)</th>
                  <th className="px-4 py-3 min-w-[130px]">New Sale (₹)</th>
                  {/* <th className="px-4 py-3 min-w-[110px] text-right">Margin / Status</th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border-subtle bg-white">
                {filteredVariants.map((v) => {
                  const currentPriceState = prices[v.id] || {
                    basePrice: String(v.basePrice),
                    salePrice: String(v.salePrice),
                  };
                  const currentErrors = errors[v.id] || {};
                  const isModified = changedVariants.some((cv) => cv.id === v.id);

                  const baseNum = parseFloat(currentPriceState.basePrice);
                  const saleNum = parseFloat(currentPriceState.salePrice);
                  const isValidNums = !isNaN(baseNum) && !isNaN(saleNum) && baseNum >= 0 && saleNum >= 0;
                  const discountDiff = isValidNums ? baseNum - saleNum : 0;
                  const discountPct = isValidNums && baseNum > 0 && discountDiff > 0
                    ? Math.round((discountDiff / baseNum) * 100)
                    : 0;

                  return (
                    <tr
                      key={v.id}
                      className={`group transition-colors ${
                        isModified ? "bg-amber-50/40" : "hover:bg-cream-50/50"
                      }`}
                    >
                      {/* Variant Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-cream-100 border border-cream-border relative overflow-hidden shrink-0 flex items-center justify-center">
                            {v.primaryImage ? (
                              <Image
                                src={v.primaryImage}
                                alt={v.variantName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-neutral-400 opacity-60" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-neutral-900 truncate">
                                {v.variantName}
                              </span>
                              {isModified && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-200 text-amber-900">
                                  Edited
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                              <span className="font-mono">{v.sku}</span>
                              {formatMeasurement(v.measurement) && (
                                <>
                                  <span>·</span>
                                  <span className="font-medium text-neutral-600">
                                    {formatMeasurement(v.measurement)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Base MRP */}
                      <td className="px-4 py-3 text-xs text-right text-neutral-400 font-medium whitespace-nowrap tabular-nums">
                        ₹{v.basePrice.toLocaleString("en-IN")}.00
                      </td>

                      {/* Current Sale Price */}
                      <td className="px-4 py-3 text-xs text-right text-neutral-700 font-semibold whitespace-nowrap tabular-nums">
                        ₹{v.salePrice.toLocaleString("en-IN")}.00
                      </td>

                      {/* New Base Price Input */}
                      <td className="px-4 py-3">
                        <div className="relative rounded-lg shadow-2xs">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-400">
                            <IndianRupee className="h-3.5 w-3.5" />
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
                            className={`block w-full rounded-lg border py-1.5 pl-8 pr-2 text-xs font-semibold outline-none transition-colors ${
                              currentErrors.basePrice
                                ? "border-red-400 bg-red-50/30 text-red-900 focus:border-red-500"
                                : "border-cream-border-hover focus:border-secondary-600 focus:bg-white"
                            }`}
                          />
                        </div>
                        {currentErrors.basePrice && (
                          <p className="mt-0.5 text-[10px] text-red-600 font-medium">
                            {currentErrors.basePrice}
                          </p>
                        )}
                      </td>

                      {/* New Sale Price Input */}
                      <td className="px-4 py-3">
                        <div className="relative rounded-lg shadow-2xs">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-400">
                            <IndianRupee className="h-3.5 w-3.5" />
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
                            className={`block w-full rounded-lg border py-1.5 pl-8 pr-2 text-xs font-bold outline-none transition-colors ${
                              currentErrors.salePrice
                                ? "border-red-400 bg-red-50/30 text-red-900 focus:border-red-500"
                                : "border-cream-border-hover focus:border-secondary-600 focus:bg-white text-secondary-900"
                            }`}
                          />
                        </div>
                        {currentErrors.salePrice && (
                          <p className="mt-0.5 text-[10px] text-red-600 font-medium">
                            {currentErrors.salePrice}
                          </p>
                        )}
                      </td>

                      {/* Margin / Status */}
                      {/* <td className="px-4 py-3 text-right whitespace-nowrap">
                        {discountDiff > 0 && discountPct > 0 ? (
                          <span className="inline-flex flex-col items-end">
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                              {discountPct}% OFF
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              Save ₹{discountDiff.toFixed(2)}
                            </span>
                          </span>
                        ) : discountDiff === 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-neutral-100 text-neutral-600">
                            No discount
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800" title="Sale price is higher than MRP">
                            Sale &gt; MRP
                          </span>
                        )}
                      </td> */}
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

export default ProductPriceEditModal;
