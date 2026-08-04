"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { QuantitySelector } from "./QuantitySelector";
import { formatPrice, calculateDiscountPrice } from "@/lib/utils";
import type { CartItemWithProduct } from "../types";

interface CartItemProps {
  item: CartItemWithProduct;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}: CartItemProps) {
  const basePrice = item.variant
    ? Number(item.variant.price)
    : Number(item.product.price);
  const discountPercent = Number(item.product.discountPercent);
  const effectivePrice = calculateDiscountPrice(basePrice, discountPercent);
  const primaryImage = item.product.images?.[0];
  const stockQuantity = item.variant
    ? item.variant.stockQuantity
    : item.product.stockQuantity;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Link
            href={`/products/${item.product.slug}`}
            className="shrink-0"
          >
            <div className="h-20 w-20 overflow-hidden rounded-md bg-muted">
              {primaryImage ? (
                <ImageWithFallback
                  src={primaryImage.url}
                  alt={primaryImage.altText || item.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
          </Link>

          <div className="flex flex-1 flex-col justify-between">
            <div>
              <Link
                href={`/products/${item.product.slug}`}
                className="font-medium hover:text-primary transition-colors line-clamp-1"
              >
                {item.product.name}
              </Link>
              {item.variant && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.variant.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                SKU: {item.product.sku}
              </p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <QuantitySelector
                value={item.quantity}
                onChange={(qty) => onUpdateQuantity(item.id, qty)}
                min={1}
                max={stockQuantity}
                disabled={isUpdating || isRemoving}
                size="sm"
              />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatPrice(effectivePrice * item.quantity)}
                  </p>
                  {discountPercent > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatPrice(basePrice * item.quantity)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(item.id)}
                  disabled={isUpdating || isRemoving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { CartItem };
