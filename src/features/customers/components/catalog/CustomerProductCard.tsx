"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { formatPrice } from "@/lib/utils";
import type { CustomerProductListItemDto } from "../../types/catalog.types";

export interface CustomerProductCardProps {
  product: CustomerProductListItemDto;
}

export function CustomerProductCard({ product }: CustomerProductCardProps) {
  const isPriceRange =
    product.minPrice !== product.maxPrice && product.maxPrice > product.minPrice;

  return (
    <Card className="group overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-xs hover:shadow-md hover:border-theme-border-accent transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Product Image Area */}
        <Link
          href={`/products/${product.id}`}
          className="block relative aspect-square overflow-hidden bg-theme-surface-alt"
        >
          {product.image ? (
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-theme-text-muted p-4 text-center">
              <Sparkles className="h-8 w-8 mb-2 text-theme-secondary opacity-60" />
              <span className="text-xs font-medium">Authentic Snack</span>
            </div>
          )}

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
        </Link>

        {/* Card Body */}
        <CardContent className="p-4 sm:p-5">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-bold text-theme-text-primary text-base leading-snug line-clamp-1 group-hover:text-theme-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          {product.description && (
            <p className="text-xs text-theme-text-subtle mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </CardContent>
      </div>

      {/* Footer Price and Action */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex items-center justify-between border-t border-theme-border-subtle mt-auto">
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

        <Link href={`/products/${product.id}`} className="pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-primary group-hover:text-theme-primary-hover transition-colors group-hover:translate-x-0.5 duration-200">
            View Options
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </Card>
  );
}
