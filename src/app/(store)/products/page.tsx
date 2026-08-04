"use client";

import { useProducts } from "@/features/products/hooks/use-products";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/common/search-input";
import { FilterDropdown } from "@/components/common/filter-dropdown";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import { useState } from "react";
import { PRODUCT_SORT_OPTIONS } from "@/lib/constants";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  const { data, isLoading, error, refetch } = useProducts({
    page,
    limit: 12,
    search: search || undefined,
    sort: sort || undefined,
  });

  const products = data?.success && data.data ? data.data : [];
  const meta = data?.meta;

  return (
    <PageContainer>
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
          options={PRODUCT_SORT_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          value={sort}
          onChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          className="w-full md:w-48"
        />
      </div>

      {isLoading && <LoadingState text="Loading products..." />}

      {error && (
        <ErrorState
          message="Failed to load products"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && (
        <>
          {products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              <ProductGrid products={products} />
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
        </>
      )}
    </PageContainer>
  );
}
