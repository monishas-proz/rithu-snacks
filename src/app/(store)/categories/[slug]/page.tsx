"use client";

import { use } from "react";
import { useCategory } from "@/features/categories/hooks/use-categories";
import { CategoryHeader } from "@/features/categories/components/CategoryHeader";
import { CategoryProductList } from "@/features/categories/components/CategoryProductList";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { slug } = use(params);
  const { data, isLoading, error, refetch } = useCategory(slug);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState text="Loading category..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          message="Failed to load category"
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const category = data?.success && data.data ? data.data : null;

  if (!category) {
    return (
      <PageContainer>
        <ErrorState message="Category not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />
      <div className="mt-6 space-y-8">
        <CategoryHeader category={category} />
        {category.children && category.children.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subcategories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {category.children.map((child) => (
                <a
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="rounded-lg border border-gray-200 p-4 hover:border-primary transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{child.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {child._count?.products || 0} products
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
        {category.products && category.products.length > 0 && (
          <CategoryProductList products={category.products} />
        )}
      </div>
    </PageContainer>
  );
}
