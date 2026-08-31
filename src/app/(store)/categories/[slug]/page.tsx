"use client";

import * as React from "react";
import Link from "next/link";
import { use } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import {
  useCustomerCategory,
  useCustomerCategories,
} from "@/features/categories";
import {
  useCustomerVariants,
  type CustomerVariantListItemDto,
} from "@/features/variants";
import {
  ProductCard,
  ProductCardSkeleton,
  Section,
} from "@/components/storefront";
import {
  SNACKSLOGOS,
  type StorefrontProduct,
} from "@/constants/storefront";
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

interface CategoryProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryProductsPage({
  params,
}: CategoryProductsPageProps) {
  const { slug } = use(params);

  const [selectedWeight, setSelectedWeight] = React.useState<
    Record<string | number, string>
  >({});
  const [wishlistIds, setWishlistIds] = React.useState<Array<string | number>>([]);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // 1. Fetch single category info
  const { data: categoryData, isLoading: isCategoryLoading } =
    useCustomerCategory(slug);

  // Fallback: search in categories list if single category not found by uuid
  const { data: categoriesListData } = useCustomerCategories({
    page: 1,
    pageSize: 50,
  });

  const categoryName = React.useMemo(() => {
    if (categoryData?.data?.name) return categoryData.data.name;
    const found = categoriesListData?.data?.find(
      (c) => c.id === slug || c.name.toLowerCase() === slug.toLowerCase()
    );
    if (found) return found.name;
    // Format slug into readable title if UUID / string
    if (slug.includes("-") && slug.length > 30) return "Category Snacks";
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }, [categoryData, categoriesListData, slug]);

  // 2. Fetch variants belonging to this category
  const {
    data: variantsData,
    isLoading: isVariantsLoading,
    isError,
    refetch,
  } = useCustomerVariants({
    categoryIds: [slug],
    page: 1,
    pageSize: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const variants = variantsData?.data || [];
  const totalCount = variantsData?.meta?.total ?? variants.length;

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product: StorefrontProduct) => {
    const activeWeight =
      selectedWeight[product.productId] || product.activeWeight || "100g";
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

  const isLoading = isCategoryLoading || isVariantsLoading;

  return (
    <div className="min-h-screen bg-cream-50 pb-20">
      {/* Toast alert feedback */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 rounded-xl bg-[var(--brown-800)] text-white px-5 py-3 shadow-xl text-sm font-medium animate-in fade-in-0 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[var(--brown-100)] to-cream-50 border-b border-[var(--brown-200)] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[var(--brown-600)] mb-4">
            <Link
              href="/"
              className="hover:text-[var(--brown-800)] transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href="/"
              className="hover:text-[var(--brown-800)] transition-colors"
            >
              Categories
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[var(--brown-800)]">
              {categoryName}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--brown-800)] header-font">
                {categoryName}
              </h1>
              <p className="mt-1 text-sm text-[var(--brown-600)]">
                Handcrafted snacks and delicacies made with authentic recipes
              </p>
            </div>

            {!isLoading && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-[var(--brown-200)] text-xs sm:text-sm font-medium text-[var(--brown-800)] self-start md:self-auto">
                <span>{totalCount} {totalCount === 1 ? "Item" : "Items"} Available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <Section className="py-8 md:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brown-700)] hover:text-[var(--brown-900)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Categories</span>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto rounded-2xl bg-white p-8 border border-red-100 shadow-sm">
              <p className="text-base font-semibold text-red-600">
                Failed to load category snacks
              </p>
              <p className="mt-2 text-sm text-gray-500">
                There was a problem connecting to the server. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-5 px-6 py-2.5 rounded-full bg-[var(--brown-700)] text-white text-sm font-medium hover:bg-[var(--brown-800)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && variants.length === 0 && (
          <div className="py-20 text-center">
            <div className="max-w-md mx-auto rounded-2xl bg-white p-8 border border-[var(--brown-200)] shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[var(--brown-100)] flex items-center justify-center mx-auto mb-4 text-[var(--brown-700)]">
                🍪
              </div>
              <h3 className="text-lg font-bold text-[var(--brown-800)] header-font">
                No Snacks Found
              </h3>
              <p className="mt-2 text-sm text-[var(--brown-600)]">
                We are currently replenishing our stock for {categoryName}. Please check back soon or explore our other delicious categories!
              </p>
              <Link
                href="/"
                className="inline-block mt-6 px-6 py-2.5 rounded-full bg-[var(--brown-700)] text-white text-sm font-medium hover:bg-[var(--brown-800)] transition-colors"
              >
                Explore Other Categories
              </Link>
            </div>
          </div>
        )}

        {/* Variants / Products Grid */}
        {!isLoading && !isError && variants.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {variants.map((variant) => {
              const product = mapVariantToProduct(variant);
              const activeWeight =
                selectedWeight[product.productId] || product.activeWeight || "100g";
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
        )}
      </Section>
    </div>
  );
}
