"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { ProductPrice } from "./ProductPrice";
import { ProductRating } from "./ProductRating";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import {
  useCustomerWishlist,
  useRemoveCustomerWishlist,
} from "@/features/customers/hooks/use-customer-wishlist";
import type { ProductListItem } from "../types";

interface ProductCardProps {
  product: ProductListItem;
}

function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const addToCart = useAddToCart();
  const removeWishlist = useRemoveCustomerWishlist();

  const { data: customerWishlist } = useCustomerWishlist({
    enabled: isAuthenticated,
  });

  const wishlistItem = customerWishlist?.items?.find(
    (item) =>
      item.product.slug === product.slug ||
      item.product.id === String(product.id)
  );
  const isInWishlist = Boolean(wishlistItem);

  const hasDiscount =
    Number(product.discountPercent) > 0 ||
    (product.comparePrice && Number(product.comparePrice) > Number(product.price));

  const primaryImage = product.images?.[0];

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      router.push(`/products/${product.slug}`);
    },
    [router, product.slug]
  );

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!session) {
        router.push("/login?callbackUrl=/products");
        return;
      }
      if (wishlistItem) {
        removeWishlist.mutate(wishlistItem.variantId);
      } else {
        router.push(`/products/${product.slug}`);
      }
    },
    [session, router, wishlistItem, removeWishlist, product.slug]
  );

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <ImageWithFallback
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              className="h-full w-full transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              -{Number(product.discountPercent)}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="info" className="absolute top-2 right-2">
              Featured
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-muted-foreground mt-1">
            {product.category.name}
          </p>
        )}

        <div className="mt-2">
          <ProductPrice
            price={Number(product.price)}
            comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
            discountPercent={Number(product.discountPercent)}
            size="sm"
          />
        </div>

        <div className="mt-2">
          <ProductRating
            reviewCount={product._count?.reviews || 0}
            size="sm"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleAddToCart}
            disabled={addToCart.isPending}
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            {addToCart.isPending ? "Adding..." : "Add to Cart"}
          </Button>
          <Button
            size="sm"
            variant={isInWishlist ? "default" : "outline"}
            onClick={handleWishlistToggle}
            disabled={removeWishlist.isPending}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`}
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { ProductCard };
