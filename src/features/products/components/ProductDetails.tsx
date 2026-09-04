"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, ShoppingCart, Package, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "./ProductGallery";
import { ProductPrice } from "./ProductPrice";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { getImageUrl } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { formatMeasurementLabel } from "@/features/variants/utils/measurement.util";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "@/features/wishlist/hooks/use-wishlist";
import type { CustomerProductDetailDto, CustomerVariantListItemDto } from "../types";

interface ProductDetailsProps {
  product: CustomerProductDetailDto;
}

function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const variants = product.variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  );
  const selectedVariant: CustomerVariantListItemDto | null =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;

  const unitPrices = selectedVariant?.unitPrices ?? [];
  const [selectedUnitPriceId, setSelectedUnitPriceId] = useState<string | null>(
    unitPrices.find((u) => u.isDefault)?.id ?? unitPrices[0]?.id ?? null
  );
  const selectedUnitPrice =
    unitPrices.find((u) => u.id === selectedUnitPriceId) ?? unitPrices[0] ?? null;

  const [quantity, setQuantity] = useState(1);

  const addToCart = useAddToCart();
  const { data: wishlist } = useWishlist({ enabled: !!session });
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    const next = variants.find((v) => v.id === variantId);
    const nextUnitPrices = next?.unitPrices ?? [];
    setSelectedUnitPriceId(
      nextUnitPrices.find((u) => u.isDefault)?.id ?? nextUnitPrices[0]?.id ?? null
    );
    setQuantity(1);
  };

  const isInStock = !selectedVariant?.outOfStock;
  const sellingPrice = selectedUnitPrice?.sellingPrice ?? 0;
  const basePrice = selectedUnitPrice?.basePrice ?? 0;
  const hasDiscount = sellingPrice < basePrice;
  const discountPercent =
    hasDiscount && basePrice > 0 ? Math.round(((basePrice - sellingPrice) / basePrice) * 100) : 0;

  const isInWishlist =
    !!selectedUnitPrice &&
    !!wishlist?.items.some((i) => i.variantUnitPriceId === selectedUnitPrice.id);

  const galleryImages = selectedVariant?.primaryImage
    ? [
        {
          id: selectedVariant.id,
          url: getImageUrl(selectedVariant.primaryImage),
          altText: selectedVariant.variantName || product.name,
        },
      ]
    : product.image
      ? [{ id: product.id, url: getImageUrl(product.image), altText: product.name }]
      : [];

  const handleAddToCart = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/products/${product.id}`);
      return;
    }
    if (!selectedUnitPrice) return;
    addToCart.mutate({ variantUnitPriceId: selectedUnitPrice.id, quantity });
  };

  const handleWishlistToggle = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/products/${product.id}`);
      return;
    }
    if (!selectedUnitPrice) return;
    if (isInWishlist) {
      removeFromWishlist.mutate(selectedUnitPrice.id);
    } else {
      addToWishlist.mutate(selectedUnitPrice.id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ProductGallery images={galleryImages} productName={selectedVariant?.variantName || product.name} />

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.category && (
              <Link
                href={`/categories/${product.category.id}`}
                className="text-sm text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            {product.brand && (
              <span className="text-sm text-muted-foreground">/ {product.brand.name}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          {selectedVariant && (
            <p className="text-lg text-muted-foreground mt-1">{selectedVariant.variantName}</p>
          )}

          {selectedUnitPrice && (
            <span className="text-sm text-muted-foreground">SKU: {selectedUnitPrice.sku}</span>
          )}
        </div>

        {selectedUnitPrice ? (
          <ProductPrice
            price={sellingPrice}
            comparePrice={hasDiscount ? basePrice : null}
            discountPercent={discountPercent}
            size="lg"
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Pricing for this item is coming soon.
          </p>
        )}

        {product.description && (
          <div
            className="rich-text-content text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }}
          />
        )}

        <ProductVariantSelector
          variants={variants}
          selectedVariantId={selectedVariantId}
          onSelect={handleSelectVariant}
        />

        {unitPrices.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Pack Size</p>
            <div className="flex flex-wrap gap-2">
              {unitPrices.map((unitPrice) => (
                <button
                  key={unitPrice.id}
                  type="button"
                  onClick={() => setSelectedUnitPriceId(unitPrice.id)}
                  className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm transition-colors ${
                    selectedUnitPriceId === unitPrice.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {formatMeasurementLabel(unitPrice.measurement)}
                </button>
              ))}
            </div>
          </div>
        )}

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

          <Button
            size="lg"
            className="flex-1"
            disabled={!isInStock || !selectedUnitPrice || addToCart.isPending}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {!selectedUnitPrice
              ? "Coming Soon"
              : !isInStock
                ? "Out of Stock"
                : addToCart.isPending
                  ? "Adding..."
                  : "Add to Cart"}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleWishlistToggle}
            disabled={addToWishlist.isPending || removeFromWishlist.isPending}
          >
            <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current text-red-500" : ""}`} />
          </Button>
        </div>

        <p
          className={`text-sm ${
            !selectedUnitPrice
              ? "text-muted-foreground"
              : isInStock
                ? "text-green-600"
                : "text-red-500"
          }`}
        >
          {!selectedUnitPrice ? "Coming Soon" : isInStock ? "In Stock" : "Out of Stock"}
        </p>

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
