"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCustomerVariants } from "@/features/variants";
import { ProductCard, ProductCardSkeleton } from "@/components/storefront";
import { mapVariantToStorefrontProduct } from "@/lib/storefront";
import { useAddToCart } from "@/features/cart/hooks/use-cart";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlistedUnitPriceIds,
} from "@/features/wishlist/hooks/use-wishlist";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/common/search-input";
import { FilterDropdown } from "@/components/common/filter-dropdown";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import type { StorefrontProduct } from "@/constants/storefront";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { value: "oldest", label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
  { value: "price_asc", label: "Price: Low to High", sortBy: "basePrice", sortOrder: "asc" },
  { value: "price_desc", label: "Price: High to Low", sortBy: "basePrice", sortOrder: "desc" },
  { value: "name_asc", label: "Name: A to Z", sortBy: "variantName", sortOrder: "asc" },
  { value: "name_desc", label: "Name: Z to A", sortBy: "variantName", sortOrder: "desc" },
] as const;

export default function ProductsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sortOption = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  const { data, isLoading, error, refetch } = useCustomerVariants({
    page,
    pageSize: 12,
    search: search || undefined,
    sortBy: sortOption.sortBy,
    sortOrder: sortOption.sortOrder,
  });

  const { wishlistedIds } = useWishlistedUnitPriceIds({ enabled: !!session });
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const products: StorefrontProduct[] = useMemo(
    () => (data?.data ?? []).map(mapVariantToStorefrontProduct),
    [data]
  );
  const meta = data?.meta;

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const requireLogin = () => router.push("/login?callbackUrl=/products");

  const handleAddToCart = (product: StorefrontProduct, unitPriceId: string) => {
    if (!session) return requireLogin();
    addToCart.mutate(
      { variantUnitPriceId: unitPriceId, quantity: 1 },
      {
        onSuccess: () => showNotification(`Added ${product.name} to cart`),
        onError: () => showNotification("Could not add item to cart"),
      }
    );
  };

  const handleWishlistToggle = (product: StorefrontProduct, unitPriceId: string) => {
    if (!session) return requireLogin();
    if (wishlistedIds.has(unitPriceId)) {
      removeFromWishlist.mutate(unitPriceId, {
        onSuccess: () => showNotification(`Removed ${product.name} from wishlist`),
      });
    } else {
      addToWishlist.mutate(unitPriceId, {
        onSuccess: () => showNotification(`Added ${product.name} to wishlist`),
      });
    }
  };

  return (
    <PageContainer>
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 rounded-xl bg-[var(--brown-800)] text-white px-5 py-3 shadow-xl text-sm font-medium animate-in fade-in-0 duration-200">
          {toastMessage}
        </div>
      )}

      <SectionHeader
        title="Products"
        description="Browse our collection of premium snacks"
      />

      <div className="flex flex-col md:flex-row gap-4 mb-8 mt-6">
        <SearchInput
          placeholder="Search products..."
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          className="w-full md:w-64"
        />
        <FilterDropdown
          label="Sort by"
          options={SORT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          value={sort}
          onChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          className="w-full md:w-48"
        />
      </div>

      {error && (
        <ErrorState
          message="Failed to load products"
          onRetry={() => refetch()}
        />
      )}

      {!error && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {isLoading &&
              Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}

            {!isLoading &&
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  type="product"
                  product={product}
                  isWishlisted={product.unitPrices.some((u) => wishlistedIds.has(u.id))}
                  onWishlistClick={(unitPriceId) => handleWishlistToggle(product, unitPriceId)}
                  onAddToCart={(unitPriceId) => handleAddToCart(product, unitPriceId)}
                  disabled={addToCart.isPending}
                />
              ))}
          </div>

          {!isLoading && products.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try adjusting your search or filters."
            />
          )}

          {meta && meta.totalPages > 1 && (
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}
    </PageContainer>
  );
}
