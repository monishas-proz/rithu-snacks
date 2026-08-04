"use client";

import { useCategories } from "@/features/categories/hooks/use-categories";
import { CategoryGrid } from "@/features/categories/components/CategoryGrid";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import { SearchInput } from "@/components/common/search-input";
import { useState } from "react";

export default function CategoriesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useCategories({
    search: search || undefined,
  });

  const categories = data?.success && data.data ? data.data : [];

  return (
    <PageContainer>
      <SectionHeader
        title="Categories"
        description="Browse our snack categories"
      />

      <div className="mt-6 mb-8">
        <SearchInput
          placeholder="Search categories..."
          onSearch={(value) => setSearch(value)}
          className="w-full md:w-64"
        />
      </div>

      {isLoading && <LoadingState text="Loading categories..." />}

      {error && (
        <ErrorState
          message="Failed to load categories"
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && (
        <CategoryGrid categories={categories} />
      )}
    </PageContainer>
  );
}
