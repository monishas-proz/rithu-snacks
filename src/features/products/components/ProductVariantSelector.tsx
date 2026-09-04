"use client";

import { cn } from "@/lib/utils";
import type { CustomerVariantListItemDto } from "../types";

interface ProductVariantSelectorProps {
  variants: CustomerVariantListItemDto[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  className?: string;
}

function ProductVariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  className,
}: ProductVariantSelectorProps) {
  if (!variants || variants.length <= 1) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-gray-900">Item</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant.id)}
            disabled={variant.outOfStock}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
              selectedVariantId === variant.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 hover:border-gray-300",
              variant.outOfStock && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>{variant.variantName}</span>
            {variant.outOfStock && (
              <span className="text-xs text-red-500">Out of stock</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { ProductVariantSelector };
