"use client";

import * as React from "react";
import Image from "next/image";
import {
  ICONS,
  SNACKSLOGOS,
  sampleStorefrontProducts,
  type StorefrontProduct,
} from "@/constants/storefront";
import { ProductCard } from "./cards/ProductCard";
import { ProductCardSkeleton } from "./cards/ProductCardSkeleton";
import { SectionHeading } from "./heading/SectionHeading";
import { PrimaryButton } from "./buttons/PrimaryButton";
import { Section } from "./Section";
import { useCustomerVariants, type CustomerVariantListItemDto } from "@/features/variants";
import { getImageUrl } from "@/lib/utils";

function resolveSnackFallbackImage(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("murukku") && lower.includes("kai")) return SNACKSLOGOS.kai_murukku;
  if (lower.includes("murukku") && lower.includes("thenkuzhal")) return SNACKSLOGOS.thenkuzhal_murukku;
  if (lower.includes("murukku") || lower.includes("butter")) return SNACKSLOGOS.special_butter_murukku;
  if (lower.includes("chip")) return SNACKSLOGOS.special_spicy_chips;
  if (lower.includes("mixture") || lower.includes("namkeen")) return SNACKSLOGOS.mixture;
  if (lower.includes("laddu")) return SNACKSLOGOS.laddu;
  if (lower.includes("jalebi")) return SNACKSLOGOS.jalebi;
  if (lower.includes("palkova")) return SNACKSLOGOS.palkova;
  return SNACKSLOGOS.special_butter_murukku;
}

function mapVariantToProduct(variant: CustomerVariantListItemDto): StorefrontProduct {
  const discount =
    variant.basePrice > variant.salePrice && variant.basePrice > 0
      ? Math.round(
          ((variant.basePrice - variant.salePrice) / variant.basePrice) * 100
        )
      : 0;

  const imageUrl = variant.primaryImage
    ? getImageUrl(variant.primaryImage)
    : resolveSnackFallbackImage(variant.productName || variant.variantName);

  const measurementStr =
    typeof variant.measurement === "string"
      ? variant.measurement
      : variant.variantName || "100g";

  return {
    productId: variant.id,
    productName: variant.productName || variant.variantName,
    image: imageUrl,
    discount,
    price50g: variant.salePrice,
    price100g: variant.salePrice,
    activeWeight: measurementStr,
    price: variant.salePrice,
    originalPrice: variant.basePrice,
  };
}

export interface ProductSectionProps {
  selectedCategoryId?: string | null;
}

export function ProductSection({ selectedCategoryId }: ProductSectionProps) {
  const [selectedWeight, setSelectedWeight] = React.useState<
    Record<string | number, string>
  >({});
  const [showAll, setShowAll] = React.useState(false);
  const [wishlistIds, setWishlistIds] = React.useState<Array<string | number>>([]);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Fetch variants from Customer Catalog Get All Variants API
  const { data: response, isLoading, isError } = useCustomerVariants({
    categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
    page: 1,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const apiVariants = response?.data;

  // Process products: map API variants if available, otherwise use sample fallback
  const products: StorefrontProduct[] = React.useMemo(() => {
    if (apiVariants && apiVariants.length > 0) {
      return apiVariants.map(mapVariantToProduct);
    }
    // If a category is selected and has 0 variants, return empty list
    if (selectedCategoryId && apiVariants && apiVariants.length === 0) {
      return [];
    }
    // Default fallback when initial DB is empty
    return sampleStorefrontProducts;
  }, [apiVariants, selectedCategoryId]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product: StorefrontProduct) => {
    const activeWeight = selectedWeight[product.productId] || product.activeWeight || "100g";
    showNotification(`Added ${product.productName} (${activeWeight}) to cart`);
  };

  const handleAddToWishlist = (product: StorefrontProduct) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.productId);
      if (exists) {
        showNotification(`Removed from wishlist`);
        return prev.filter((id) => id !== product.productId);
      } else {
        showNotification(`Added ${product.productName} to wishlist`);
        return [...prev, product.productId];
      }
    });
  };

  const visibleProducts = showAll ? products : products.slice(0, 4);

  return (
    <Section className="py-12 relative">
      {/* Toast alert feedback */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 rounded-xl bg-[var(--brown-800)] text-white px-5 py-3 shadow-xl text-sm font-medium animate-in fade-in-0 duration-200">
          {toastMessage}
        </div>
      )}

      <SectionHeading title="Better snacking starts here!" />

      {/* Products Grid */}
      <div
        className="
          grid
          grid-cols-2
          gap-3
          sm:gap-6
          md:grid-cols-3
          lg:grid-cols-4
        "
      >
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={`skeleton-${index}`} />
          ))}

        {!isLoading &&
          visibleProducts.map((product) => {
            const activeWeight = selectedWeight[product.productId] || product.activeWeight || "100g";
            const isWishlisted = wishlistIds.includes(product.productId);

            const productData: StorefrontProduct = {
              ...product,
              activeWeight,
              price: product.price,
              originalPrice: product.originalPrice,
            };

            return (
              <ProductCard
                key={product.productId}
                type="product"
                product={productData}
                isWishlisted={isWishlisted}
                setSelectedWeight={setSelectedWeight}
                onWishlistClick={() => handleAddToWishlist(productData)}
                onButtonClick={() => handleAddToCart(productData)}
              />
            );
          })}
      </div>

      {/* Empty State */}
      {!isLoading && !isError && products.length === 0 && (
        <div className="py-16 text-center text-sm text-[var(--color-neutral-500)]">
          <p className="text-base font-medium text-[var(--brown-800)]">
            No snacks found in this category.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Please explore our other delicious snack categories.
          </p>
        </div>
      )}

      {/* View All Button */}
      {products.length > 4 && (
        <div className="flex justify-center mt-12">
          <PrimaryButton
            variant="brown"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm cursor-pointer hover:scale-105 duration-300 transition-all"
          >
            <Image
              src={ICONS.view_all}
              alt="view_all"
              width={16}
              height={16}
              className="invert"
            />
            <span className="header-font">
              {showAll ? "Show Less" : "View All"}
            </span>
          </PrimaryButton>
        </div>
      )}
    </Section>
  );
}

export default ProductSection;
