"use client";

import Link from "next/link";
import { Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { ProductPrice } from "@/features/products/components/ProductPrice";
import { formatPrice, calculateDiscountPrice } from "@/lib/utils";
import type { WishlistItemWithProduct } from "../types";

interface WishlistCardProps {
  item: WishlistItemWithProduct;
  onRemove: (productId: number) => void;
  onMoveToCart?: (productId: number) => void;
  isRemoving?: boolean;
  isMovingToCart?: boolean;
}

function WishlistCard({
  item,
  onRemove,
  onMoveToCart,
  isRemoving = false,
  isMovingToCart = false,
}: WishlistCardProps) {
  const hasDiscount =
    Number(item.product.discountPercent) > 0 ||
    (item.product.comparePrice &&
      Number(item.product.comparePrice) > Number(item.product.price));

  const primaryImage = item.product.images?.[0];

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${item.product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <ImageWithFallback
              src={primaryImage.url}
              alt={primaryImage.altText || item.product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              -{Number(item.product.discountPercent)}%
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${item.product.slug}`}>
          <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
            {item.product.name}
          </h3>
        </Link>

        {item.product.category && (
          <p className="text-xs text-muted-foreground mt-1">
            {item.product.category.name}
          </p>
        )}

        <div className="mt-2">
          <ProductPrice
            price={Number(item.product.price)}
            comparePrice={
              item.product.comparePrice
                ? Number(item.product.comparePrice)
                : null
            }
            discountPercent={Number(item.product.discountPercent)}
            size="sm"
          />
        </div>

        <div className="mt-3 flex gap-2">
          {onMoveToCart && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onMoveToCart(item.productId)}
              disabled={isRemoving || isMovingToCart}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              {isMovingToCart ? "Moving..." : "Move to Cart"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(item.productId)}
            disabled={isRemoving || isMovingToCart}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { WishlistCard };
