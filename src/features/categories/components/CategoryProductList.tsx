"use client";

import { ProductGrid } from "@/features/products/components/ProductGrid";
import type { CategoryDetail } from "../types";
import type { ProductListItem } from "@/features/products/types";

interface CategoryProductListProps {
  products: CategoryDetail["products"];
}

function CategoryProductList({ products }: CategoryProductListProps) {
  const activeProducts = products.filter((p) => p.isActive);

  const transformedProducts: ProductListItem[] = activeProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: null,
    sku: "",
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    discountPercent: Number(p.discountPercent),
    isActive: p.isActive,
    isFeatured: false,
    category: null as ProductListItem["category"],
    brand: p.brand,
    images: p.images,
    _count: { reviews: 0, orderItems: 0 },
  }));

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Products in this category
      </h2>
      <ProductGrid
        products={transformedProducts}
        emptyMessage="No products in this category"
      />
    </div>
  );
}

export { CategoryProductList };
