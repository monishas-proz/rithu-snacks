"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/common/ProductImage";
import { formatPrice } from "@/lib/utils";
import type { CustomerProductListItemDto } from "../../types/catalog.types";

export interface CustomerProductCardProps {
  product: CustomerProductListItemDto;
}

export function CustomerProductCard({ product }: CustomerProductCardProps) {
  const isPriceRange =
    product.minPrice !== product.maxPrice && product.maxPrice > product.minPrice;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded-2xl transition-transform duration-200 active:scale-[0.99]"
    >
      <Card className="h-full overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-xs hover:shadow-md hover:border-theme-border-accent transition-all duration-300 flex flex-col justify-between cursor-pointer">
        <div>
          {/* Product Image Area */}
          <div className="relative aspect-square overflow-hidden bg-theme-surface-alt">
            <ProductImage
              src={product.image}
              alt={product.name}
              fallbackText={product.name}
              containerClassName="w-full h-full aspect-square"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badges on Image */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
              {product.category && (
                <Badge className="bg-theme-surface/95 backdrop-blur-xs text-theme-primary font-semibold text-[11px] px-2.5 py-0.5 rounded-full border border-theme-border-input shadow-xs">
                  {product.category.name}
                </Badge>
              )}
            </div>

            {product.brand && (
              <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
                <span className="inline-flex items-center gap-1 bg-theme-text-primary/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  <Tag className="h-2.5 w-2.5" />
                  {product.brand.name}
                </span>
              </div>
            )}
          </div>

          {/* Card Body */}
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-bold text-theme-text-primary text-base leading-snug line-clamp-1 group-hover:text-theme-primary transition-colors">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-xs text-theme-text-subtle mt-1.5 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </CardContent>
        </div>

        {/* Footer Price */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-theme-border-subtle mt-auto">
          <div className="pt-3">
            <span className="text-[11px] text-theme-text-muted block uppercase tracking-wider font-semibold">
              Price
            </span>
            <div className="text-base sm:text-lg font-bold text-theme-primary mt-0.5">
              {isPriceRange ? (
                <span>
                  {formatPrice(product.minPrice)} – {formatPrice(product.maxPrice)}
                </span>
              ) : (
                <span>{formatPrice(product.minPrice)}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
