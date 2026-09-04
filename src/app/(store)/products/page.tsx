"use client";

import { useState, useMemo } from "react";
import { Sparkles, X, ArrowUpDown, Tag } from "lucide-react";
import { SearchInput } from "@/components/common/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Button, Select } from "@/components/ui";
import {
  useCustomerProducts,
  useCustomerCategories,
  useCustomerBrands,
} from "@/features/customers/hooks/use-customer-catalog";
import { CustomerProductGrid } from "@/features/customers/components/catalog/CustomerProductGrid";
import type { CustomerProductListInput } from "@/features/customers/validations/catalog.schema";

const SORT_OPTIONS: {
  value: string;
  label: string;
  sortBy: CustomerProductListInput["sortBy"];
  sortOrder: CustomerProductListInput["sortOrder"];
}[] = [
  { value: "createdAt_desc", label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { value: "price_asc", label: "Price: Low to High", sortBy: "price", sortOrder: "asc" },
  { value: "price_desc", label: "Price: High to Low", sortBy: "price", sortOrder: "desc" },
  { value: "name_asc", label: "Name: A to Z", sortBy: "name", sortOrder: "asc" },
  { value: "name_desc", label: "Name: Z to A", sortBy: "name", sortOrder: "desc" },
];

function ProductCatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <div
          key={n}
          className="rounded-2xl border border-theme-border bg-theme-surface p-4 space-y-4"
        >
          <div className="aspect-square w-full rounded-xl bg-theme-surface-alt" />
          <div className="space-y-2">
            <div className="h-4 w-20 rounded-md bg-theme-border-subtle" />
            <div className="h-5 w-3/4 rounded-md bg-theme-border" />
            <div className="h-3 w-full rounded-md bg-theme-surface-alt" />
          </div>
          <div className="pt-2 border-t border-theme-border-subtle flex items-center justify-between">
            <div className="h-6 w-16 rounded-md bg-theme-border" />
            <div className="h-4 w-20 rounded-md bg-theme-border-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShopAllPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState("createdAt_desc");

  // Fetch Categories for filter chips
  const { data: categoriesData } = useCustomerCategories({ pageSize: 50 });
  const categories = categoriesData?.data ?? [];

  // Fetch Brands for filter dropdown
  const { data: brandsData } = useCustomerBrands({ pageSize: 50 });
  const brands = brandsData?.data ?? [];

  // Find active sort config
  const activeSort = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.value === sortKey) ?? SORT_OPTIONS[0];
  }, [sortKey]);

  // Query products from Customer Catalog POST /api/customer/products
  const {
    data: productsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useCustomerProducts({
    page,
    pageSize: 12,
    search: search ? search.trim() : undefined,
    categoryIds: selectedCategory ? [selectedCategory] : undefined,
    brandIds: selectedBrand ? [selectedBrand] : undefined,
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  });

  const products = productsResponse?.data ?? [];
  const meta = productsResponse?.meta;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSortKey("createdAt_desc");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) || Boolean(selectedCategory) || Boolean(selectedBrand);

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Hero / Header Banner */}
      <div className="border-b border-theme-border bg-gradient-to-b from-theme-surface-warm to-theme-surface-alt py-10 sm:py-14">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-primary-light text-theme-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-theme-secondary" />
            Heritage Treats & Snacks
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-theme-text-primary font-serif tracking-tight">
            Shop All Snacks
          </h1>
          <p className="mt-3 text-sm sm:text-base text-theme-text-subtle max-w-2xl mx-auto leading-relaxed">
            Authentic South Indian snacks, savories, and traditional sweets crafted with pure ingredients and timeless recipes.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-10 max-w-7xl">
        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setPage(1);
                }}
                className={`
                  px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 shrink-0
                  ${
                    selectedCategory === null
                      ? "bg-theme-primary text-theme-primary-fg shadow-xs"
                      : "bg-theme-surface text-theme-text-subtle border border-theme-border hover:bg-theme-surface-alt"
                  }
                `}
              >
                All Snacks
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(isSelected ? null : cat.id);
                      setPage(1);
                    }}
                    className={`
                      px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 shrink-0
                      ${
                        isSelected
                          ? "bg-theme-primary text-theme-primary-fg shadow-xs"
                          : "bg-theme-surface text-theme-text-subtle border border-theme-border hover:bg-theme-surface-alt"
                      }
                    `}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Toolbar: Search, Brand Filter, Sort Dropdown */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-6 border-b border-theme-border">
          {/* Search Box */}
          <div className="w-full md:w-80">
            <SearchInput
              placeholder="Search by snack name or flavor..."
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              defaultValue={search}
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Brand Filter (if multiple brands exist) */}
            {brands.length > 0 && (
              <div className="min-w-[150px] flex-1 sm:flex-initial">
                <Select
                  value={selectedBrand || ""}
                  onValueChange={(val) => {
                    setSelectedBrand(val || null);
                    setPage(1);
                  }}
                  placeholder="All Brands"
                  options={[
                    { value: "", label: "All Brands" },
                    ...brands.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                  icon={<Tag className="h-3.5 w-3.5" />}
                  size="md"
                />
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="min-w-[190px] flex-1 sm:flex-initial">
              <Select
                value={sortKey}
                onValueChange={(val) => {
                  setSortKey(val);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
                icon={<ArrowUpDown className="h-3.5 w-3.5" />}
                size="md"
              />
            </div>

            {/* Reset All Filters Button */}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="destructive"
                size="md"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Results Counter and Active Filter Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 text-xs text-theme-text-subtle">
          <div>
            {isLoading ? (
              <span>Loading snacks...</span>
            ) : (
              <span>
                Showing{" "}
                <strong className="text-theme-text-primary">{meta?.total ?? products.length}</strong>{" "}
                authentic {meta?.total === 1 ? "snack" : "snacks"}
              </span>
            )}
          </div>

          {isFetching && !isLoading && (
            <span className="text-theme-primary font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-theme-primary animate-ping" />
              Updating list...
            </span>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-theme-border bg-theme-surface-alt p-8 text-center max-w-md mx-auto my-8">
            <h3 className="text-base font-bold text-theme-text-primary mb-2">
              Unable to load snacks
            </h3>
            <p className="text-xs text-theme-text-subtle mb-4">
              We encountered a connection issue fetching the product catalog.
            </p>
            <Button
              onClick={() => refetch()}
              className="h-9 px-5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg text-xs font-semibold cursor-pointer"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Content Area: Skeleton vs Products */}
        {isLoading ? (
          <ProductCatalogSkeleton />
        ) : (
          <>
            <CustomerProductGrid
              products={products}
              onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
            />

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                    window.scrollTo({ top: 150, behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
