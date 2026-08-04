"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import type { ProductDetail } from "../types";

interface ProductVariantSelectorProps {
  variants: ProductDetail["variants"];
  selectedVariantId: number | null;
  onSelect: (variantId: number | null) => void;
  className?: string;
}

function ProductVariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  className,
}: ProductVariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-gray-900">Variant</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onSelect(variant.id)}
            disabled={variant.stockQuantity <= 0}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
              selectedVariantId === variant.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 hover:border-gray-300",
              variant.stockQuantity <= 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>{variant.name}</span>
            {Number(variant.price) !== 0 && (
              <span className="text-muted-foreground">+{formatPrice(Number(variant.price))}</span>
            )}
            {variant.stockQuantity <= 0 && (
              <span className="text-xs text-red-500">Out of stock</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { ProductVariantSelector };
