"use client";

import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProductListItem } from "../types";

interface ProductGridProps {
  products: ProductListItem[];
  emptyMessage?: string;
}

function ProductGrid({ products, emptyMessage = "No products found" }: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export { ProductGrid };
