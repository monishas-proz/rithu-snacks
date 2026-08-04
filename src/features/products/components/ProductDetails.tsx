"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Package, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "./ProductGallery";
import { ProductPrice } from "./ProductPrice";
import { ProductRating } from "./ProductRating";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { formatPrice } from "@/lib/utils";
import type { ProductDetail } from "../types";

interface ProductDetailsProps {
  product: ProductDetail;
}

function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = selectedVariantId
    ? product.variants?.find((v) => v.id === selectedVariantId)
    : null;

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
  const stockQuantity = selectedVariant ? selectedVariant.stockQuantity : undefined;
  const isInStock = stockQuantity === undefined || stockQuantity > 0;

  const averageRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ProductGallery
        images={product.images || []}
        productName={product.name}
      />

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-sm text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            {product.brand && (
              <span className="text-sm text-muted-foreground">
                / {product.brand.name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center gap-4 mt-3">
            <ProductRating
              rating={averageRating}
              reviewCount={product._count?.reviews || 0}
              size="md"
            />
            <span className="text-sm text-muted-foreground">
              SKU: {product.sku}
            </span>
          </div>
        </div>

        <ProductPrice
          price={currentPrice}
          comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
          discountPercent={Number(product.discountPercent)}
          size="lg"
        />

        {product.shortDescription && (
          <p className="text-muted-foreground">{product.shortDescription}</p>
        )}

        {product.description && (
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>{product.description}</p>
          </div>
        )}

        <ProductVariantSelector
          variants={product.variants || []}
          selectedVariantId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />

        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 hover:bg-muted transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-2 hover:bg-muted transition-colors"
            >
              +
            </button>
          </div>

          <Button size="lg" className="flex-1" disabled={!isInStock}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isInStock ? "Add to Cart" : "Out of Stock"}
          </Button>

          <Button size="lg" variant="outline">
            <Heart className="h-5 w-5" />
          </Button>
        </div>

        {stockQuantity !== undefined && (
          <p className={`text-sm ${isInStock ? "text-green-600" : "text-red-500"}`}>
            {isInStock
              ? `In Stock (${stockQuantity} available)`
              : "Out of Stock"}
          </p>
        )}

        <hr className="border-gray-200" />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Package className="h-5 w-5" />
            <span>Free shipping over ₹999</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Truck className="h-5 w-5" />
            <span>Delivery in 3-5 days</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span>Quality guaranteed</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RotateCcw className="h-5 w-5" />
            <span>Easy returns</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ProductDetails };
