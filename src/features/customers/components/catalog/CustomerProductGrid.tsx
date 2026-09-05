"use client";

import { CustomerProductCard } from "./CustomerProductCard";
import { Sparkles } from "lucide-react";
import type { CustomerProductListItemDto } from "../../types/catalog.types";

interface CustomerProductGridProps {
  products: CustomerProductListItemDto[];
  onResetFilters?: () => void;
}

export function CustomerProductGrid({
  products,
  onResetFilters,
}: CustomerProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-theme-border bg-theme-surface p-12 text-center max-w-md mx-auto my-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-surface-alt text-theme-text-muted">
          <Sparkles className="h-7 w-7 text-theme-secondary" />
        </div>
        <h3 className="text-lg font-bold text-theme-text-primary mb-1">
          No snacks matched your search
        </h3>
        <p className="text-sm text-theme-text-subtle mb-6">
          Try clearing your active filters or searching for something else.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg text-xs font-semibold cursor-pointer transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
      {products.map((product) => (
        <CustomerProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
