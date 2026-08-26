"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Package,
  Layers,
  Tag,
  FileText,
  Sparkles,
} from "lucide-react";
import { useAdminProduct } from "@/features/products/hooks";
import { useVariants } from "@/features/variants/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useBrands } from "@/features/brands/hooks";
import { useHsnCodes } from "@/features/hsn-codes/hooks";
import { ProductPriceEditModal } from "@/features/products/components/ProductPriceEditModal";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";

type VariantFilter = "all" | "active" | "inactive";

function formatMeasurement(m: any): string {
  if (!m) return "—";
  if (typeof m === "string") return m;
  if (typeof m === "object" && "value" in m && "unit" in m) {
    return `${m.value} ${m.unit}`.trim() || "—";
  }
  return "—";
}

export default function AdminProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params?.id ? decodeURIComponent(params.id) : "";

  // 1. Main Product Query
  const {
    data: productResponse,
    isLoading: isLoadingProduct,
    isError: isProductError,
    error: productError,
    refetch: refetchProduct,
  } = useAdminProduct(productId);

  // Safely extract the product object from ApiResponse wrapper { success: true, data: { ... } }
  const product: any = (productResponse as any)?.data ?? productResponse;

  // 2. Product Variants Query using the POST "Get All Variants" API (POST /api/admin/variants)
  const {
    data: variantsResponse,
    isLoading: isLoadingVariants,
    refetch: refetchVariants,
  } = useVariants(
    productId
      ? {
          productIds: [productId],
          pageSize: 100,
        }
      : undefined
  );

  // 3. Lookup reference data for taxonomy
  const { data: categoriesData } = useCategories({ pageSize: 100 });
  const { data: brandsData } = useBrands({ limit: 100 });
  const { data: hsnData } = useHsnCodes({ pageSize: 100 });

  // 4. Modal & Filter State
  const [isPriceEditOpen, setIsPriceEditOpen] = React.useState(false);
  const [variantFilter, setVariantFilter] = React.useState<VariantFilter>("all");

  const variants = variantsResponse?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const brands = brandsData?.data ?? [];
  const hsnCodes = hsnData?.data ?? [];

  // Robust Lookups for human-readable labels with nested object fallbacks
  const categoryName = React.useMemo(() => {
    if (product?.category?.name) return product.category.name;
    if (product?.categoryName) return product.categoryName;
    if (!product?.categoryId) return null;
    const cat = categories.find(
      (c: any) =>
        c.id === product.categoryId ||
        c.uuid === product.categoryId ||
        String(c.id) === String(product.categoryId)
    );
    return cat ? cat.name : null;
  }, [product, categories]);

  const brandName = React.useMemo(() => {
    if (product?.brand?.name) return product.brand.name;
    if (product?.brandName) return product.brandName;
    if (!product?.brandId) return null;
    const b = brands.find(
      (b: any) =>
        b.uuid === product.brandId ||
        b.id === product.brandId ||
        String(b.id) === String(product.brandId)
    );
    return b ? b.name : null;
  }, [product, brands]);

  const hsnCodeInfo = React.useMemo(() => {
    if (product?.product_hsn_codes?.code) {
      return `${product.product_hsn_codes.code}${
        product.product_hsn_codes.description
          ? ` (${product.product_hsn_codes.description})`
          : ""
      }`;
    }
    if (product?.hsnCode?.code) {
      return `${product.hsnCode.code}${
        product.hsnCode.description ? ` (${product.hsnCode.description})` : ""
      }`;
    }
    if (typeof product?.hsnCode === "string") return product.hsnCode;
    if (!product?.hsnCodeId) return null;
    const h = hsnCodes.find(
      (item: any) =>
        item.id === product.hsnCodeId ||
        item.uuid === product.hsnCodeId ||
        String(item.id) === String(product.hsnCodeId)
    );
    return h ? `${h.code}${h.description ? ` (${h.description})` : ""}` : null;
  }, [product, hsnCodes]);

  // Filtered variants
  const filteredVariants = React.useMemo(() => {
    if (variantFilter === "active") {
      return variants.filter((v) => v.isActive);
    }
    if (variantFilter === "inactive") {
      return variants.filter((v) => !v.isActive);
    }
    return variants;
  }, [variants, variantFilter]);

  const activeCount = React.useMemo(
    () => variants.filter((v) => v.isActive).length,
    [variants]
  );
  const inactiveCount = React.useMemo(
    () => variants.filter((v) => !v.isActive).length,
    [variants]
  );

  if (isLoadingProduct && !product) {
    return <LoadingState text="Loading product details..." />;
  }

  if (isProductError || !product) {
    return (
      <ErrorState
        message={
          (productError as any)?.message ||
          "Failed to load product details. Product not found or inactive."
        }
        onRetry={() => refetchProduct()}
      />
    );
  }

  const renderVegBadge = (vegType: string) => {
    if (!vegType) return <span className="text-neutral-500 text-sm">Not Assigned</span>;
    switch (vegType?.toLowerCase()) {
      case "veg":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Vegetarian
          </span>
        );
      case "nonveg":
      case "non-veg":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            Non-Veg
          </span>
        );
      case "vegan":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            Vegan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
            {vegType}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* 
        Top Header: Displays clean breadcrumb and actual product name from the API.
        Expected structure:
        Product
        Product Name
        (NO Edit Prices button at the top, NO first info box with Inactive/Standard/Slug)
      */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <Link
            href="/admin/dashboard/products"
            className="text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Products
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          <span className="font-bold text-neutral-900 uppercase truncate max-w-[240px] sm:max-w-md">
            {product.name || "Product Details"}
          </span>
        </div>
        {/* <h1
          className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight"
          style={{ fontFamily: "var(--font-hanken)" }}
        >
          {product.name}
        </h1> */}
      </div>

      {/* Product Overview Details: Specifications and Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Specifications Card */}
        <div className="lg:col-span-7 rounded-2xl border border-[#EDE8E1] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#801B2B]" />
              <h2 className="text-base font-semibold text-neutral-900">
                Product Specifications
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={product.isActive ? "success" : "secondary"}
                className="text-xs"
              >
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Category */}
            <div className="rounded-xl border border-[#EDE8E1] bg-[#F8F6F2] p-3.5">
              <span className="text-xs text-neutral-500 font-medium">Category</span>
              <p className="mt-1 font-semibold text-neutral-900 text-sm truncate">
                {categoryName || "Not Assigned"}
              </p>
            </div>

            {/* Brand */}
            <div className="rounded-xl border border-[#EDE8E1] bg-[#F8F6F2] p-3.5">
              <span className="text-xs text-neutral-500 font-medium">Brand</span>
              <p className="mt-1 font-semibold text-neutral-900 text-sm truncate">
                {brandName || "Not Assigned"}
              </p>
            </div>

            {/* HSN Code */}
            <div className="rounded-xl border border-[#EDE8E1] bg-[#F8F6F2] p-3.5">
              <span className="text-xs text-neutral-500 font-medium">HSN Code</span>
              <p className="mt-1 font-semibold text-neutral-900 text-sm truncate">
                {hsnCodeInfo || "Not Assigned"}
              </p>
            </div>

            {/* Dietary Type */}
            <div className="rounded-xl border border-[#EDE8E1] bg-[#F8F6F2] p-3.5">
              <span className="text-xs text-neutral-500 font-medium">Dietary Type</span>
              <div className="mt-1">
                {renderVegBadge(product.vegType || product.veg_type)}
              </div>
            </div>

            {/* Created Date */}
            <div className="rounded-xl border border-[#EDE8E1] bg-[#F8F6F2] p-3.5">
              <span className="text-xs text-neutral-500 font-medium">Created Date</span>
              <p className="mt-1 font-medium text-neutral-800 text-xs">
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Not Assigned"}
              </p>
            </div>

            {/* Last Updated */}
            <div className="rounded-xl border border-[#EDE8E1] bg-[#F8F6F2] p-3.5">
              <span className="text-xs text-neutral-500 font-medium">Last Updated</span>
              <p className="mt-1 font-medium text-neutral-800 text-xs">
                {product.updatedAt
                  ? new Date(product.updatedAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not Assigned"}
              </p>
            </div>

            {/* Slug */}
            {product.slug && (
              <div className="sm:col-span-2 md:col-span-3 rounded-xl border border-[#EDE8E1] bg-[#F8F6F2] p-3.5">
                <span className="text-xs text-neutral-500 font-medium">Slug</span>
                <p className="mt-0.5 font-mono text-xs text-neutral-800 font-semibold truncate">
                  {product.slug}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description Card */}
        <div className="lg:col-span-5 rounded-2xl border border-[#EDE8E1] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center gap-2 border-b border-[#EDE8E1] pb-3 mb-4">
            <FileText className="h-5 w-5 text-[#801B2B]" />
            <h2 className="text-base font-semibold text-neutral-900">
              Description
            </h2>
          </div>

          <div className="space-y-4 flex-1 text-sm">
            {product.shortDescription && (
              <div>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Summary
                </span>
                <p className="mt-1 text-neutral-700 leading-relaxed font-medium">
                  {product.shortDescription}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Full Description
              </span>
              <p className="mt-1 text-neutral-600 leading-relaxed whitespace-pre-line">
                {product.description || (
                  <span className="italic text-neutral-400">
                    No detailed description provided.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        Product Variants Section:
        Variants are fetched using the POST Get All Variants API (POST /api/admin/variants)
        passing { productIds: [productId] }.
      */}
      <div className="rounded-2xl border border-[#EDE8E1] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Section Header */}
        <div className="bg-[#F8F6F2] border-b border-[#EDE8E1] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-[#801B2B]" />
            <h2 className="text-base font-bold text-neutral-900">
              Product Variants
            </h2>
            <span className="rounded-full bg-white text-[#801B2B] text-xs font-semibold px-2.5 py-0.5 border border-[#EDE8E1]">
              {variants.length} {variants.length === 1 ? "variant" : "variants"}
            </span>
          </div>

          {/* Controls: Filter tabs & Single Common Edit Prices Action */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-lg border border-[#EDE8E1] bg-white p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setVariantFilter("all")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  variantFilter === "all"
                    ? "bg-[#801B2B] text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                All ({variants.length})
              </button>
              <button
                type="button"
                onClick={() => setVariantFilter("active")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  variantFilter === "active"
                    ? "bg-[#801B2B] text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setVariantFilter("inactive")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  variantFilter === "inactive"
                    ? "bg-[#801B2B] text-white font-semibold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>

            {/* Edit Prices Button (kept in the variants section where it belongs) */}
            <button
              type="button"
              onClick={() => setIsPriceEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#801B2B] text-[#801B2B] bg-white hover:bg-[#801B2B]/5 text-xs font-semibold transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Edit Prices</span>
            </button>
          </div>
        </div>

        {/* Variants List / Table */}
        <div className="p-5 sm:p-6">
          {isLoadingVariants ? (
            <div className="py-12 flex justify-center">
              <LoadingState text="Loading variants..." />
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#EDE8E1] bg-[#F8F6F2]">
              <Package className="mx-auto h-10 w-10 text-neutral-400" />
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">
                No {variantFilter !== "all" ? `${variantFilter} ` : ""}variants found
              </h3>
              <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
                {variantFilter === "all"
                  ? "This product currently has no variants associated with it."
                  : `No variants with ${variantFilter} status match the current filter.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#EDE8E1]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F6F2] text-xs font-semibold text-neutral-600 uppercase border-b border-[#EDE8E1]">
                  <tr>
                    <th className="px-4 py-3 min-w-[70px]">Image</th>
                    <th className="px-4 py-3 min-w-[180px]">Variant Details</th>
                    <th className="px-4 py-3 min-w-[120px]">SKU</th>
                    <th className="px-4 py-3 min-w-[110px]">Measurement</th>
                    <th className="px-4 py-3 min-w-[110px]">Base Price</th>
                    <th className="px-4 py-3 min-w-[110px]">Sale Price</th>
                    <th className="px-4 py-3 min-w-[100px]">Status</th>
                    <th className="px-4 py-3 min-w-[110px]">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE8E1] bg-white">
                  {filteredVariants.map((variant) => (
                    <tr
                      key={variant.id}
                      className="hover:bg-[#F8F6F2]/50 transition-colors"
                    >
                      {/* Variant Image */}
                      <td className="px-4 py-3">
                        <div className="relative h-12 w-12 rounded-lg border border-[#EDE8E1] bg-[#F5F2EC] overflow-hidden shrink-0 flex items-center justify-center">
                          {variant.primaryImage ? (
                            <Image
                              src={variant.primaryImage}
                              alt={variant.variantName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-neutral-400" />
                          )}
                        </div>
                      </td>

                      {/* Variant Name */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-semibold text-neutral-900 block leading-snug">
                            {variant.variantName}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">
                            ID: {variant.id.slice(0, 8)}...
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                        {variant.sku}
                      </td>

                      {/* Measurement / Unit */}
                      <td className="px-4 py-3 font-medium text-neutral-700">
                        {formatMeasurement(variant.measurement)}
                      </td>

                      {/* Base Price */}
                      <td className="px-4 py-3 font-medium text-neutral-600 whitespace-nowrap">
                        ₹{variant.basePrice.toLocaleString("en-IN")}
                      </td>

                      {/* Sale Price */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-neutral-900">
                          ₹{variant.salePrice.toLocaleString("en-IN")}
                        </span>
                        {variant.salePrice < variant.basePrice && (
                          <span className="ml-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                            Save ₹{(variant.basePrice - variant.salePrice).toLocaleString("en-IN")}
                          </span>
                        )}
                      </td>

                      {/* Status (Active vs Inactive Badge directly from API response) */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={variant.isActive ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {variant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                        {variant.updatedAt
                          ? new Date(variant.updatedAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Price Edit Modal for All Variants */}
      <ProductPriceEditModal
        open={isPriceEditOpen}
        onClose={() => setIsPriceEditOpen(false)}
        productUuid={productId}
        productName={product.name}
        variants={variants}
        onSuccess={() => {
          refetchVariants();
          refetchProduct();
        }}
      />
    </div>
  );
}
