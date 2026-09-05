"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Heart,
  ShoppingCart,
  Package,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandableRichText } from "@/components/ui/expandable-rich-text";
import { ProductGallery } from "./ProductGallery";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { getImageUrl } from "@/lib/utils";
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
    hasDiscount && basePrice > 0
      ? Math.round(((basePrice - sellingPrice) / basePrice) * 100)
      : 0;

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
    addToCart.mutate({
      variantUnitPriceId: selectedUnitPrice.id,
      variantId: selectedVariant?.id,
      quantity,
    });
  };

  const handleWishlistToggle = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!session) {
      router.push(`/login?callbackUrl=/products/${product.id}`);
      return;
    }
    if (!selectedUnitPrice) return;
    if (addToWishlist.isPending || removeFromWishlist.isPending) return;

    if (isInWishlist) {
      removeFromWishlist.mutate(selectedUnitPrice.id);
    } else {
      addToWishlist.mutate(selectedUnitPrice.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left Gallery */}
      <div className="lg:col-span-6 sticky top-24">
        <ProductGallery
          images={galleryImages}
          productName={selectedVariant?.variantName || product.name}
          isInStock={isInStock}
        />
      </div>

      {/* Right Details */}
      <div className="lg:col-span-6 space-y-6">
        {/* Category, Brand & SKU Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {product.category && (
            <Link
              href={`/categories/${product.category.id}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#8B1D1D]/10 text-[#8B1D1D] hover:bg-[#8B1D1D]/20 transition-colors"
            >
              {product.category.name}
            </Link>
          )}
          {product.brand && (
            <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
              Brand: <strong className="text-stone-700">{product.brand.name}</strong>
            </span>
          )}
          {selectedUnitPrice?.sku && (
            <span className="text-xs font-mono text-stone-400 bg-stone-50 border border-stone-200/80 px-2.5 py-1 rounded-full">
              SKU: {selectedUnitPrice.sku}
            </span>
          )}
        </div>

        {/* Titles */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
            {product.name}
          </h1>
          {selectedVariant && (
            <p className="text-base sm:text-lg text-stone-600 font-medium mt-1.5">
              {selectedVariant.variantName}
            </p>
          )}
        </div>

        {/* Pricing Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/50 via-stone-50 to-white border border-amber-200/40">
          {selectedUnitPrice ? (
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#8B1D1D] tracking-tight">
                ₹{sellingPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg sm:text-xl line-through text-stone-400">
                  ₹{basePrice.toFixed(2)}
                </span>
              )}
              {hasDiscount && discountPercent > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3" />
                  Save {discountPercent}%
                </span>
              )}
              <span className="text-xs text-stone-400 block w-full mt-1">
                Inclusive of all taxes • Freshly packed
              </span>
            </div>
          ) : (
            <p className="text-sm text-stone-500 italic">
              Pricing for this item is coming soon.
            </p>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div
            className="rich-text-content text-sm text-stone-600 leading-relaxed max-w-none border-b border-stone-100 pb-4"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }}
          />
        )}

        {/* Variant Selector */}
        {variants.length > 1 && (
          <ProductVariantSelector
            variants={variants}
            selectedVariantId={selectedVariantId}
            onSelect={handleSelectVariant}
          />
        )}

        {/* Pack Size / Measurement Pills */}
        {unitPrices.length > 0 && (
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-stone-800 flex items-center justify-between">
              <span>Choose Pack Size</span>
              {selectedUnitPrice && (
                <span className="text-xs text-stone-500 font-normal">
                  Selected: {formatMeasurementLabel(selectedUnitPrice.measurement)}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {unitPrices.map((unitPrice) => {
                const isSelected = selectedUnitPriceId === unitPrice.id;
                return (
                  <button
                    key={unitPrice.id}
                    type="button"
                    onClick={() => setSelectedUnitPriceId(unitPrice.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? "border-[#8B1D1D] bg-[#8B1D1D] text-white shadow-xs scale-102"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {formatMeasurementLabel(unitPrice.measurement)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls: Quantity + Add to Cart + Wishlist */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center border border-stone-200 rounded-xl bg-white shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || addToCart.isPending}
                className="w-11 h-12 flex items-center justify-center text-lg font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40 transition-colors"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-12 text-center text-sm font-semibold text-stone-900 select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={addToCart.isPending}
                className="w-11 h-12 flex items-center justify-center text-lg font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40 transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Add to Cart CTA */}
            <Button
              type="button"
              size="lg"
              disabled={!isInStock || !selectedUnitPrice || addToCart.isPending}
              onClick={handleAddToCart}
              className="flex-1 h-12 bg-[#8B1D1D] hover:bg-[#731616] text-white rounded-xl shadow-xs font-semibold text-base transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {addToCart.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {!selectedUnitPrice
                    ? "Unavailable"
                    : !isInStock
                      ? "Out of Stock"
                      : "Add to Cart"}
                </>
              )}
            </Button>

            {/* Wishlist Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => handleWishlistToggle(e)}
              disabled={addToWishlist.isPending || removeFromWishlist.isPending}
              className={`h-12 w-12 rounded-xl border-stone-200 hover:border-stone-400 bg-white transition-all active:scale-95 ${
                isInWishlist ? "border-rose-300 bg-rose-50/50" : ""
              }`}
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              {addToWishlist.isPending || removeFromWishlist.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              ) : (
                <Heart
                  className={`h-5 w-5 transition-transform ${
                    isInWishlist
                      ? "fill-rose-500 text-rose-500 scale-110"
                      : "text-stone-600 hover:text-rose-500"
                  }`}
                />
              )}
            </Button>
          </div>

          {/* Stock availability indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !selectedUnitPrice
                  ? "bg-stone-300"
                  : isInStock
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                    : "bg-rose-500 ring-4 ring-rose-500/20"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                !selectedUnitPrice
                  ? "text-stone-500"
                  : isInStock
                    ? "text-emerald-700"
                    : "text-rose-600"
              }`}
            >
              {!selectedUnitPrice
                ? "Unavailable"
                : isInStock
                  ? "In Stock • Ready to ship"
                  : "Currently Out of Stock"}
            </span>
          </div>
        </div>

        <hr className="border-stone-200" />

        {/* Quality Assurance Guarantees */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-100">
            <Package className="h-5 w-5 text-[#8B1D1D] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-stone-800">Free Shipping</p>
              <p className="text-[11px] text-stone-500">On orders above ₹999</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-100">
            <Truck className="h-5 w-5 text-[#8B1D1D] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-stone-800">Fast Delivery</p>
              <p className="text-[11px] text-stone-500">Delivered in 3-5 days</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-100">
            <ShieldCheck className="h-5 w-5 text-[#8B1D1D] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-stone-800">100% Authentic</p>
              <p className="text-[11px] text-stone-500">Traditional recipes</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/80 border border-stone-100">
            <RotateCcw className="h-5 w-5 text-[#8B1D1D] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-stone-800">Easy Returns</p>
              <p className="text-[11px] text-stone-500">Hassle-free guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ProductDetails };
