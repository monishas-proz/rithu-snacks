"use client";

import { use } from "react";
import { useProduct } from "@/features/products/hooks/use-products";
import { ProductDetails } from "@/features/products/components/ProductDetails";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = use(params);
  const { data, isLoading, error, refetch } = useProduct(slug);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState text="Loading product..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          message="Failed to load product"
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const product = data?.success && data.data ? data.data : null;

  if (!product) {
    return (
      <PageContainer>
        <ErrorState message="Product not found" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          ...(product.category
            ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />
      <div className="mt-6">
        <ProductDetails product={product} />
      </div>
    </PageContainer>
  );
}
