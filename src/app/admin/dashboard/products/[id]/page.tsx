"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  Pencil,
  Trash2,
  Eye,
  IndianRupee,
  Check,
  CheckCircle2,
  ExternalLink,
  Download,
  Plus,
  X,
  AlertCircle,
  Clock,
  ArrowDownRight,
  Filter,
  MoreHorizontal,
  Power,
  PowerOff,
  Images as ImagesIcon,
} from "lucide-react";
import { useAdminProduct } from "@/features/products/hooks";
import {
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "@/features/variants/hooks";
import { useUpdateProduct } from "@/features/products/hooks/use-product-mutations";
import { useCategories } from "@/features/categories/hooks";
import { useBrands } from "@/features/brands/hooks";
import { useHsnCodes } from "@/features/hsn-codes/hooks";
import { useUnits } from "@/features/units/hooks";
import { ProductPriceEditModal } from "@/features/products/components/ProductPriceEditModal";
import { ProductForm, type ProductFormValues } from "@/features/products/components/ProductForm";
import { VariantForm, VariantImageUploader, type VariantFormValues, type UnitFormItem } from "@/features/variants/components";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormModal } from "@/components/common/FormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AdminVariantResponse } from "@/features/variants/types";

type VariantFilter = "active" | "inactive";

function formatMeasurement(m: any): string {
  if (!m) return "—";
  if (typeof m === "string") return m;
  if (typeof m === "object" && "value" in m && "unit" in m) {
    return `${m.value} ${m.unit}`.trim() || "—";
  }
  return "—";
}

function renderDietaryBadge(vegType?: string | null) {
  const type = (vegType || "na").toLowerCase();
  let label = "Vegetarian";
  let markColor = "#2F7A3C";

  if (type === "nonveg" || type === "non-veg") {
    label = "Non-vegetarian";
    markColor = "#A33127";
  } else if (type === "vegan") {
    label = "Vegan";
    markColor = "#1D7A44";
  } else if (type === "egg" || type === "contains egg") {
    label = "Contains egg";
    markColor = "#C08A1E";
  } else if (type === "na" || !vegType) {
    label = "Not Assigned";
    markColor = "#A2968C";
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F7F2EC] text-[#5C534C] text-xs font-bold border border-[#E4D9CD]">
      <span
        className="w-3 h-3 rounded-[2px] flex items-center justify-center"
        style={{ border: `1.5px solid ${markColor}` }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: markColor }}
        />
      </span>
      <span>{label}</span>
    </span>
  );
}

export default function AdminProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rawId = params?.id ? decodeURIComponent(params.id) : "";
  const productId = rawId && rawId !== "undefined" ? rawId : "";

  // 1. Main Product Query
  const {
    data: productResponse,
    isLoading: isLoadingProduct,
    isError: isProductError,
    error: productError,
    refetch: refetchProduct,
  } = useAdminProduct(productId);

  const product: any = (productResponse as any)?.data ?? productResponse;

  const isUuid = (val?: string): val is string =>
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // Safely determine the product UUID so we never send invalid non-UUID strings to the backend API
  const productUuid:string| null = isUuid(product?.id)
    ? product.id
    : isUuid(productId)
    ? productId
    : undefined;

  const canonicalProductId = productUuid || product?.id || productId;

  // Filter & Selection State (Active by default, Inactive for inactive tab)
  const [variantFilter, setVariantFilter] = React.useState<VariantFilter>("active");

  // 2. Product Variants Query using the POST "Get All Variants" API (POST /api/admin/variants)
  // Queries variants for this product based on the active tab (isActive: true or false)
  const {
    data: variantsResponse,
    isLoading: isLoadingVariants,
  } = useVariants(
    productUuid
      ? {
          productIds: [productUuid],
          isActive: variantFilter === "active",
          pageSize: 100,
          page: 1,
          
        }
      : undefined,
    { enabled: !!productUuid }
  );

  const variants = React.useMemo<AdminVariantResponse[]>(() => {
    return (variantsResponse?.data as AdminVariantResponse[]) ?? [];
  }, [variantsResponse]);

  // Reference queries for modal form dropdowns (lazy-loaded when modals open)
  const [isEditProductOpen, setIsEditProductOpen] = React.useState(false);
  const [isAddVariantOpen, setIsAddVariantOpen] = React.useState(false);
  const [editingVariant, setEditingVariant] = React.useState<AdminVariantResponse | null>(null);
  const [viewingVariant, setViewingVariant] = React.useState<AdminVariantResponse | null>(null);
  const [editingPriceVariant, setEditingPriceVariant] = React.useState<AdminVariantResponse | null>(null);
  const [deletingVariant, setDeletingVariant] = React.useState<AdminVariantResponse | null>(null);
  const [variantToDeactivate, setVariantToDeactivate] = React.useState<AdminVariantResponse | null>(null);
  const [variantToActivate, setVariantToActivate] = React.useState<AdminVariantResponse | null>(null);
  const [managingImagesVariant, setManagingImagesVariant] = React.useState<AdminVariantResponse | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<{
    variant: AdminVariantResponse;
    rect: DOMRect;
  } | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = React.useState(false);
  const [isPriceEditOpen, setIsPriceEditOpen] = React.useState(false);

  // Close action dropdown menu when clicking outside, scrolling, or pressing Escape
  React.useEffect(() => {
    if (!activeMenu) return;

    const handleClose = () => setActiveMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenu(null);
    };

    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("mousedown", (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-portal]") && !target.closest("[data-action-trigger]")) {
        setActiveMenu(null);
      }
    });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenu]);

  const isAnyFormOpen = isEditProductOpen || isAddVariantOpen || !!editingVariant;

  const { data: categoriesData } = useCategories(
    { pageSize: 100 },
    { enabled: isEditProductOpen }
  );
  const { data: brandsData } = useBrands(
    { limit: 100 },
    { enabled: isEditProductOpen }
  );
  console.log(brandsData,"brandName");
  
  const { data: hsnData } = useHsnCodes(
    { pageSize: 100 },
    { enabled: isEditProductOpen }
  );
  const { data: unitsData } = useUnits(
    { pageSize: 100 }
  );

  // Mutations
  const updateProductMutation = useUpdateProduct();
  const createVariantMutation = useCreateVariant();
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();

  // Selection State
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, boolean>>({});

  // Single price edit state
  const [singleBasePrice, setSingleBasePrice] = React.useState("");
  const [singleSalePrice, setSingleSalePrice] = React.useState("");
  const [singlePriceError, setSinglePriceError] = React.useState<string | null>(null);

  // Populate single price modal inputs when editingPriceVariant changes
  React.useEffect(() => {
    if (editingPriceVariant) {
      setSingleBasePrice(String(editingPriceVariant.basePrice ?? ""));
      setSingleSalePrice(String(editingPriceVariant.salePrice ?? ""));
      setSinglePriceError(null);
    }
  }, [editingPriceVariant]);

  // Labels from product response
  const categoryName = product?.categoryName || product?.category?.name || null;
  const brandName = product?.brandName || product?.brand?.name || null;
  const hsnCodeInfo =
    product?.hsnCodeName ||
    (product?.product_hsn_codes?.code
      ? `${product.product_hsn_codes.code}${
          product.product_hsn_codes.description
            ? ` (${product.product_hsn_codes.description})`
            : ""
        }`
      : null) ||
    (product?.hsnCode?.code
      ? `${product.hsnCode.code}${
          product.hsnCode.description ? ` (${product.hsnCode.description})` : ""
        }`
      : null) ||
    (typeof product?.hsnCode === "string" ? product.hsnCode : null);

  const currentTabCount = variantsResponse?.meta?.total ?? variants.length;

  // Selection helpers
  const selectedIds = React.useMemo(
    () => Object.keys(selectedVariants).filter((id) => selectedVariants[id]),
    [selectedVariants]
  );
  const hasSelection = selectedIds.length > 0;
  const isAllSelected =
    variants.length > 0 &&
    variants.every((v) => selectedVariants[v.id]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVariants({});
    } else {
      const next: Record<string, boolean> = {};
      variants.forEach((v) => {
        next[v.id] = true;
      });
      setSelectedVariants(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Export Variants to CSV
  const handleExportVariants = () => {
    if (variants.length === 0) {
      return;
    }

    const headers = [
      "Variant ID",
      "Variant Name",
      "SKU",
      "Measurement",
      "Base Price",
      "Sale Price",
      "Status",
      "Last Updated",
    ];

    const rows = variants.map((v) => [
      `"${v.id}"`,
      `"${v.variantName.replace(/"/g, '""')}"`,
      `"${v.sku}"`,
      `"${formatMeasurement(v.measurement)}"`,
      v.basePrice,
      v.salePrice,
      v.isActive ? "Active" : "Inactive",
      v.updatedAt ? new Date(v.updatedAt).toISOString() : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${product?.slug || "product"}-variants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Make Variant Inactive (from Active tab)
  const handleMakeInactive = async (variant: AdminVariantResponse) => {
    setIsStatusUpdating(true);
    try {
      await updateVariantMutation.mutateAsync({
        productUuid: canonicalProductId,
        variantUuid: variant.id,
        data: { isActive: false },
      });
      setVariantToDeactivate(null);
    } catch (err: any) {
      console.error("Failed to make variant inactive", err);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Make Variant Active (from Inactive tab)
  const handleMakeActive = async (variant: AdminVariantResponse) => {
    setIsStatusUpdating(true);
    try {
      await updateVariantMutation.mutateAsync({
        productUuid: canonicalProductId,
        variantUuid: variant.id,
        data: { isActive: true },
      });
      setVariantToActivate(null);
    } catch (err: any) {
      console.error("Failed to activate variant", err);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Bulk status update
  const handleBulkStatusChange = async (targetActive: boolean) => {
    if (!hasSelection) return;
    try {
      const selectedObjs = variants.filter((v) => selectedVariants[v.id]);
      await Promise.all(
        selectedObjs.map((obj) =>
          updateVariantMutation.mutateAsync({
            productUuid: canonicalProductId,
            variantUuid: obj.id,
            data: { isActive: targetActive },
          })
        )
      );
      setSelectedVariants({});
    } catch (err: any) {
      console.error("Bulk update failed", err);
    }
  };

  // Single price save
  const handleSaveSinglePrice = async () => {
    if (!editingPriceVariant) return;
    const base = parseFloat(singleBasePrice);
    const sale = parseFloat(singleSalePrice);

    if (isNaN(base) || base < 0) {
      setSinglePriceError("Please enter a valid base price (0 or more).");
      return;
    }
    if (isNaN(sale) || sale < 0) {
      setSinglePriceError("Please enter a valid sale price (0 or more).");
      return;
    }

    try {
      await updateVariantMutation.mutateAsync({
        productUuid: canonicalProductId,
        variantUuid: editingPriceVariant.id,
        data: { basePrice: base, salePrice: sale },
      });
      setEditingPriceVariant(null);
    } catch (err: any) {
      setSinglePriceError(err?.message || "Failed to update price");
    }
  };

  // Stats (Dummy data)
  const stats = React.useMemo(() => {
    const lastUpdatedDate = product?.updatedAt
      ? new Date(product.updatedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

    const lastUpdatedTime = product?.updatedAt
      ? new Date(product.updatedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

    return {
      priceRange: "₹100 – ₹500",
      priceRangeNote: "Across variants",
      avgDiscount: "10%",
      avgDiscountNote: "Standard discount",
      lastUpdatedDate,
      lastUpdatedTime,
    };
  }, [product]);

  // Options for Dropdowns
  const categoryOptions = React.useMemo(
    () => (categoriesData?.data ?? []).map((c: any) => ({ value: c.id || c.uuid, label: c.name, slug: c.slug })),
    [categoriesData]
  );
  const brandOptions = React.useMemo(
    () => (brandsData?.data ?? []).map((b: any) => ({ value: b.uuid || b.id, label: b.name, slug: b.slug })),
    [brandsData]
  );
  const hsnOptions = React.useMemo(
    () =>
      (hsnData?.data ?? []).map((h: any) => ({
        value: h.id,
        label: `${h.code}${h.description ? ` (${h.description})` : ""}`,
      })),
    [hsnData]
  );
  const unitOptions = React.useMemo<UnitFormItem[]>(
    () =>
      (unitsData?.data ?? []).map((u: any) => ({
        id: u.id,
        value: u.id,
        label: `${u.name} (${u.code})`,
        name: u.name,
        code: u.code,
        type: u.type,
        conversionFactor: u.conversionFactor ? Number(u.conversionFactor) : 1,
      })),
    [unitsData]
  );

  // Resolve product thumbnail
  const primaryProductImage =
    product?.images?.[0]?.url ||
    product?.image_url ||
    variants.find((v) => v.primaryImage)?.primaryImage ||
    null;

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

  return (
    <div className="w-full space-y-5 text-[#2A2422]">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#8A7F76] pb-1">
        <Link
          href="/admin/dashboard/products"
          className="hover:text-[#40100F] transition-colors"
        >
          Products
        </Link>
        <span className="opacity-40">/</span>
        <span className="text-[#211C1A] font-semibold truncate max-w-[200px] sm:max-w-md">
          {product.name}
        </span>
      </div>

      {/* Section 1: Hero Overview Header Card */}
        <section className="bg-white border border-[#EDE4D9] rounded-2xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(64,16,15,0.04)] flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
          <div className="flex gap-5 items-center min-w-0">
            {/* Product Image Thumbnail */}
            <div className="w-[92px] h-[92px] rounded-xl flex-none bg-[#F6EFE7] border border-[#EDE4D9] relative overflow-hidden flex items-center justify-center">
              {primaryProductImage ? (
                <Image
                  src={primaryProductImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-center">
                  <Package className="w-6 h-6 text-[#A2968C] mx-auto mb-1 opacity-70" />
                  <span className="font-mono text-[9px] text-[#A2968C] block leading-tight">
                    product<br />shot
                  </span>
                </div>
              )}
            </div>

            {/* Title & Badges */}
            <div className="min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-[25px] font-bold tracking-tight text-[#211C1A]">
                  {product.name}
                </h1>
                {/* Active/Inactive badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.isActive
                      ? "bg-[#E8F6EC] text-[#1D7A44]"
                      : "bg-[#F4EFEA] text-[#8A7F76]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      product.isActive ? "bg-[#2AA35C]" : "bg-[#A2968C]"
                    }`}
                  />
                  {product.isActive ? "Active" : "Inactive"}
                </span>

                {/* Featured badge */}
                {product.isFeatured && (
                  <span className="px-2.5 py-1 rounded-full bg-[#FDF0DC] text-[#96601A] text-xs font-bold">
                    Featured
                  </span>
                )}

                {/* Dietary badge */}
                {renderDietaryBadge(product.vegType || product.veg_type)}
              </div>

              {/* Category · Brand · Slug subline */}
              <div className="flex items-center gap-3 flex-wrap text-xs sm:text-sm text-[#7C7169]">
                <span>{categoryName || "Not Assigned"}</span>
                <span className="opacity-40">·</span>
                <span>{brandName || "Not Assigned"}</span>
                <span className="opacity-40">·</span>
                <span className="font-mono text-xs text-[#4A423D] bg-[#F7F2EC] px-2 py-0.5 rounded border border-[#EDE4D9]">
                  {product.slug || "NO_SLUG"}
                </span>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2.5 flex-none w-full md:w-auto justify-end">
            {/* {product.slug && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                className="px-3.5 py-2 rounded-lg border border-[#E4D9CD] bg-white text-[#4A423D] hover:bg-[#F7F2EC] text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                <span>Preview</span>
              </Link>
            )} */}
            <button
              type="button"
              onClick={() => setIsEditProductOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#7A2224] hover:bg-[#5F1A1C] text-[#FFF6EC] text-xs sm:text-sm font-semibold transition-all shadow-[0_1px_2px_rgba(64,16,15,0.2)] flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit product</span>
            </button>
          </div>
        </section>

        {/* Section 2: Stats Cards Grid (3 Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-[#EDE4D9] rounded-2xl p-4 sm:p-5 flex flex-col gap-1.5 shadow-[0_1px_2px_rgba(64,16,15,0.02)]">
            <div className="text-[11px] font-bold tracking-wider text-[#A2968C] uppercase">
              Price Range
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#211C1A]">
              {stats.priceRange}
            </div>
            <div className="text-xs text-[#8A7F76]">{stats.priceRangeNote}</div>
          </div>

          <div className="bg-white border border-[#EDE4D9] rounded-2xl p-4 sm:p-5 flex flex-col gap-1.5 shadow-[0_1px_2px_rgba(64,16,15,0.02)]">
            <div className="text-[11px] font-bold tracking-wider text-[#A2968C] uppercase">
              Variants Status
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#211C1A] flex items-center gap-2">
              <span className="text-[#1D7A44]"> Active</span>
              <span className="text-[#A2968C] text-base font-normal">/</span>
              <span className="text-[#7C7169]">Inactive</span>
            </div>
            {/* <div className="text-xs text-[#8A7F76]">
              {inactiveCount > 0
                ? `${inactiveCount} inactive variant${inactiveCount > 1 ? "s" : ""}`
                : "All variants active"} · Avg. disc. {stats.avgDiscount}
            </div> */}
          </div>

          <div className="bg-white border border-[#EDE4D9] rounded-2xl p-4 sm:p-5 flex flex-col gap-1.5 shadow-[0_1px_2px_rgba(64,16,15,0.02)]">
            <div className="text-[11px] font-bold tracking-wider text-[#A2968C] uppercase">
              Last Updated
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#211C1A]">
              {stats.lastUpdatedDate}
            </div>
            <div className="text-xs text-[#8A7F76]">{stats.lastUpdatedTime || "Recent"}</div>
          </div>
        </section>

        {/* Section 3: Two-Column Specifications & Description Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Specifications Card */}
          <div className="lg:col-span-7 bg-white border border-[#EDE4D9] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(64,16,15,0.02)]">
            <div className="px-5 py-4 border-b border-[#F1E8DE] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#211C1A] tracking-tight">
                Product specifications
              </h2>
              
            </div>
            <div className="divide-y divide-[#F6F0E9]">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors">
                <div className="sm:col-span-5 text-xs text-[#8A7F76] font-medium">Category</div>
                <div className="sm:col-span-7 text-xs sm:text-sm text-[#211C1A] font-semibold truncate">
                  {categoryName || "Not Assigned"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors">
                <div className="sm:col-span-5 text-xs text-[#8A7F76] font-medium">Brand</div>
                <div className="sm:col-span-7 text-xs sm:text-sm text-[#211C1A] font-semibold truncate">
                  {brandName || "Not Assigned"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors">
                <div className="sm:col-span-5 text-xs text-[#8A7F76] font-medium">HSN Code</div>
                <div className="sm:col-span-7 text-xs sm:text-sm text-[#211C1A] font-semibold truncate">
                  {hsnCodeInfo || "Not Assigned"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors">
                <div className="sm:col-span-5 text-xs text-[#8A7F76] font-medium">Dietary Type</div>
                <div className="sm:col-span-7 text-xs sm:text-sm">
                  {renderDietaryBadge(product.vegType || product.veg_type)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors">
                <div className="sm:col-span-5 text-xs text-[#8A7F76] font-medium">Slug</div>
                <div className="sm:col-span-7 font-mono text-xs text-[#4A423D] font-semibold truncate">
                  {product.slug || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors">
                <div className="sm:col-span-5 text-xs text-[#8A7F76] font-medium">Created Date</div>
                <div className="sm:col-span-7 text-xs sm:text-sm text-[#211C1A] font-semibold">
                  {product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors">
                <div className="sm:col-span-5 text-xs text-[#8A7F76] font-medium">Last Updated</div>
                <div className="sm:col-span-7 text-xs sm:text-sm text-[#211C1A] font-semibold">
                  {product.updatedAt
                    ? new Date(product.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="lg:col-span-5 bg-white border border-[#EDE4D9] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(64,16,15,0.02)] flex flex-col">
            <div className="px-5 py-4 border-b border-[#F1E8DE] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#211C1A] tracking-tight">
                Description
              </h2>
            </div>
            <div className="p-5 flex-1">
              {product.shortDescription || product.description ? (
                <div className="space-y-4">
                  {product.shortDescription && (
                    <div>
                      <div className="text-[11px] font-bold text-[#A2968C] uppercase tracking-wider mb-1">
                        Summary
                      </div>
                      <p className="text-xs sm:text-sm text-[#4A423D] leading-relaxed">
                        {product.shortDescription}
                      </p>
                    </div>
                  )}

                  {product.description && (
                    <div>
                      <div className="text-[11px] font-bold text-[#A2968C] uppercase tracking-wider mb-1">
                        Full Description
                      </div>
                      <p className="text-xs sm:text-sm text-[#6B615A] leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 px-4 text-center flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F7F2EC] border border-[#EDE4D9] flex items-center justify-center text-[#A2968C]">
                    <FileText className="w-5 h-5 opacity-60" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#4A423D]">
                    No description yet
                  </div>
                  <p className="text-xs text-[#8A7F76] max-w-[280px] leading-relaxed">
                    Product descriptions appear on the storefront and in exported catalogues.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditProductOpen(true)}
                    className="mt-1 border border-[#E4D9CD] bg-white text-[#7A2224] hover:bg-[#FBF3F2] hover:border-[#E3C8C4] text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Add description
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Product Variants Section with FIXED ACTION COLUMN */}
        <section className="bg-white border border-[#EDE4D9] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(64,16,15,0.02)]">
          {/* Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-[#F1E8DE] flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* Left: Title, Counter Badge & Segmented Filter Tabs */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#211C1A] tracking-tight">
                  Product variants
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F7F2EC] border border-[#EDE4D9] text-xs font-bold text-[#7C7169]">
                  {currentTabCount}
                </span>
              </div>

              {/* Filter Tabs with Count Pills */}
              <div className="flex p-1 bg-[#F7F2EC] border border-[#EDE4D9] rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setVariantFilter("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    variantFilter === "active"
                      ? "bg-[#7A2224] text-[#FFF6EC] shadow-xs"
                      : "text-[#7C7169] hover:text-[#211C1A] hover:bg-white"
                  }`}
                >
                  <span>Active</span>
                  {variantFilter === "active" && (
                    <span className="px-1.5 py-0.5 text-[10.5px] rounded-full font-bold leading-none bg-white/20 text-[#FFF6EC]">
                      {currentTabCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setVariantFilter("inactive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    variantFilter === "inactive"
                      ? "bg-[#7A2224] text-[#FFF6EC] shadow-xs"
                      : "text-[#7C7169] hover:text-[#211C1A] hover:bg-white"
                  }`}
                >
                  <span>Inactive</span>
                  {variantFilter === "inactive" && (
                    <span className="px-1.5 py-0.5 text-[10.5px] rounded-full font-bold leading-none bg-white/20 text-[#FFF6EC]">
                      {currentTabCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Actions (Export, Edit prices, Add variant) */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-end">
              {/* <button
                type="button"
                onClick={handleExportVariants}
                className="px-3.5 py-1.5 rounded-lg border border-[#E4D9CD] bg-white text-[#4A423D] hover:bg-[#F7F2EC] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Export variants to CSV"
              >
                <Download className="w-3.5 h-3.5 opacity-70" />
                <span>Export</span>
              </button> */}

              <button
                type="button"
                onClick={() => setIsPriceEditOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E3C8C4] bg-[#FBF3F2] hover:bg-[#F6E7E5] text-[#7A2224] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Bulk edit prices"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Edit prices</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddVariantOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#7A2224] hover:bg-[#5F1A1C] text-[#FFF6EC] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(64,16,15,0.2)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add variant</span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Action Bar */}
          {hasSelection && (
            <div className="px-5 py-2.5 bg-[#FBF3F2] border-b border-[#F2DDD9] flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#7A2224]">
                {selectedIds.length} variant{selectedIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariants({})}
                  className="px-2.5 py-1 rounded-md border border-[#E3C8C4] bg-white hover:bg-[#F6E7E5] text-[#7A2224] font-semibold cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange(true)}
                  className="px-2.5 py-1 rounded-md border border-[#E3C8C4] bg-white hover:bg-[#F6E7E5] text-[#1D7A44] font-semibold cursor-pointer"
                >
                  Activate
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange(false)}
                  className="px-2.5 py-1 rounded-md border border-[#E3C8C4] bg-white hover:bg-[#F6E7E5] text-[#A2968C] font-semibold cursor-pointer"
                >
                  Deactivate
                </button>
              </div>
            </div>
          )}

          {/* Variants Table */}
          {isLoadingVariants ? (
            <div className="py-16 flex justify-center">
              <LoadingState text="Loading variants..." />
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Package className="mx-auto h-10 w-10 text-neutral-300" />
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">
                No {variantFilter} variants found
              </h3>
              <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
                {variantFilter === "active"
                  ? "This product currently has no active variants associated with it."
                  : "No variants are currently marked as inactive."}
              </p>
              <button
                type="button"
                onClick={() => setIsAddVariantOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7A2224] text-[#FFF6EC] text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add first variant</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[560px] relative scrollbar-thin">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-30 bg-[#FAF7F3] text-[11px] font-bold tracking-wider text-[#A2968C] uppercase shadow-[0_1px_0_#F1E8DE]">
                  <tr>
                    {/* Checkbox */}
                    <th className="px-3.5 py-3 w-[44px] min-w-[44px] text-center border-b border-[#F1E8DE]">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-[#D8CBBC] text-[#7A2224] focus:ring-[#7A2224] cursor-pointer"
                      />
                    </th>

                    <th className="px-4 py-3 min-w-[200px] border-b border-[#F1E8DE]">Variant</th>
                    <th className="px-4 py-3 min-w-[120px] border-b border-[#F1E8DE]">SKU</th>
                    <th className="px-4 py-3 min-w-[90px] border-b border-[#F1E8DE]">Size</th>
                    <th className="px-4 py-3 min-w-[90px] text-right border-b border-[#F1E8DE]">Base</th>
                    <th className="px-4 py-3 min-w-[110px] text-right border-b border-[#F1E8DE]">Sale</th>
                    {/* <th className="px-4 py-3 min-w-[90px] text-right border-b border-[#F1E8DE]">Margin</th> */}
                    <th className="px-3 py-3 min-w-[95px] text-center border-b border-[#F1E8DE]">Status</th>

                    {/* FIXED ACTION COLUMN (Sticky top & right corner) */}
                    <th className="sticky top-0 right-0 z-40 bg-[#FAF7F3] text-center px-2 py-3 w-[72px] min-w-[72px] border-b border-[#F1E8DE] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05),0_1px_0_#F1E8DE]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F6F0E9] bg-white">
                  {variants.map((variant) => {
                    const isPicked = !!selectedVariants[variant.id];
                    const discount =
                      variant.basePrice > 0 && variant.salePrice < variant.basePrice
                        ? variant.basePrice - variant.salePrice
                        : 0;
                    const margin =
                      variant.basePrice > 0
                        ? Math.round(
                            ((variant.basePrice - (variant.salePrice || variant.basePrice)) /
                              variant.basePrice) *
                              100
                          )
                        : 0;

                    return (
                      <tr
                        key={variant.id}
                        className={`group transition-colors ${
                          isPicked ? "bg-[#FDF8F4]" : "hover:bg-[#FCFAF7]"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3.5 py-3 w-[44px] min-w-[44px] text-center">
                          <input
                            type="checkbox"
                            checked={isPicked}
                            onChange={() => toggleSelectOne(variant.id)}
                            className="w-4 h-4 rounded border-[#D8CBBC] text-[#7A2224] focus:ring-[#7A2224] cursor-pointer"
                          />
                        </td>

                        {/* Variant Name & Image */}
                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-[38px] h-[38px] rounded-[9px] flex-none bg-[#F6EFE7] border border-[#EDE4D9] relative overflow-hidden flex items-center justify-center">
                              {variant.primaryImage ? (
                                <Image
                                  src={variant.primaryImage}
                                  alt={variant.variantName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-[#A2968C] opacity-70" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-[#211C1A] block leading-snug truncate">
                                {variant.variantName}
                              </span>
                              <span className="font-mono text-[11px] text-[#A2968C] block truncate">
                                {variant.id ? `ID: ${variant.id.slice(0, 8)}...` : "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3 min-w-[120px] font-mono text-[11.5px] text-[#6B615A] truncate">
                          {variant.sku}
                        </td>

                        {/* Size / Measurement */}
                        <td className="px-4 py-3 min-w-[90px] text-xs font-medium text-[#4A423D] whitespace-nowrap">
                          {formatMeasurement(variant.measurement)}
                        </td>

                        {/* Base Price */}
                        <td className="px-4 py-3 min-w-[90px] text-xs text-right font-medium text-[#8A7F76] whitespace-nowrap tabular-nums">
                          ₹{variant.basePrice.toLocaleString("en-IN")}
                        </td>

                        {/* Sale Price */}
                        <td className="px-4 py-3 min-w-[110px] text-right whitespace-nowrap tabular-nums">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <span className="font-bold text-[#211C1A] text-xs sm:text-sm">
                              ₹{variant.salePrice.toLocaleString("en-IN")}
                            </span>
                            {discount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[#E8F6EC] text-[#1D7A44] text-[10.5px] font-bold">
                                −₹{discount.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Margin - commented out until backend API support is added
                        <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums whitespace-nowrap">
                          <span
                            className={margin > 0 ? "text-[#1D7A44]" : "text-[#8A7F76]"}
                          >
                            {margin > 0 ? `${margin}% off` : "0%"}
                          </span>
                        </td>
                        */}

                        {/* Status */}
                        <td className="px-3 py-3 min-w-[95px] text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              variant.isActive
                                ? "bg-[#E8F6EC] text-[#1D7A44] border border-[#C2E4CC]"
                                : "bg-[#F5F2EE] text-[#7C7169] border border-[#E5DFD7]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                variant.isActive ? "bg-[#2AA35C]" : "bg-[#A2968C]"
                              }`}
                            />
                            {variant.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* FIXED ACTION COLUMN (Sticky right) */}
                        <td
                          className={`sticky right-0 transition-colors px-2 py-3 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-20 ${
                            isPicked
                              ? "bg-[#FDF8F4]"
                              : "bg-white group-hover:bg-[#FCFAF7]"
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            {variant.isActive ? (
                              <button
                                type="button"
                                data-action-trigger
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeMenu?.variant.id === variant.id) {
                                    setActiveMenu(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveMenu({ variant, rect });
                                  }
                                }}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                  activeMenu?.variant.id === variant.id
                                    ? "bg-[#7A2224] text-[#FFF6EC] border-[#7A2224] shadow-xs"
                                    : "border-[#EDE4D9] bg-white hover:bg-[#FBF3F2] text-[#4A423D] hover:text-[#7A2224]"
                                }`}
                                title="More actions"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setVariantToActivate(variant)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#C2E4CC] bg-[#E8F6EC] hover:bg-[#D5EEDB] text-[#1D7A44] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Make Active"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>Active</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Variants Table Footer */}
          <div className="px-5 py-3.5 border-t border-[#F1E8DE] bg-[#FCFAF7]/50 flex items-center justify-between text-xs text-[#8A7F76] flex-wrap gap-2">
            <span>
              Showing <strong className="text-[#211C1A]">{variants.length}</strong> of{" "}
              <strong className="text-[#211C1A]">{currentTabCount}</strong>{" "}
              {variantFilter} variants
            </span>
          </div>
        </section>

      {/* Floating Portal Action Dropdown Menu (Guaranteed Zero Clipping & Viewport Clamping) */}
      {activeMenu &&
        typeof document !== "undefined" &&
        createPortal(
          (() => {
            const { variant, rect } = activeMenu;
            const menuWidth = 192; // 12rem = 192px
            const menuHeight = variant.isActive ? 220 : 60;

            // Position on the LEFT side of the button icon:
            let left = rect.left - menuWidth - 8;
            if (left < 10) {
              left = 10;
            }

            // Align vertically with the button icon:
            // "don't show in top" -> align to button top (starts at button and flows downwards)
            let top = rect.top;
            if (top + menuHeight > window.innerHeight - 12) {
              top = Math.max(12, window.innerHeight - menuHeight - 12);
            }

            return (
              <div
                data-action-portal
                style={{
                  position: "fixed",
                  top: `${top}px`,
                  left: `${left}px`,
                  width: `${menuWidth}px`,
                  zIndex: 9999,
                }}
                className="rounded-xl border border-[#EDE4D9] bg-white p-1.5 shadow-2xl animate-in zoom-in-95 duration-100 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {variant.isActive ? (
                  <>
                    {/* 1. View Product Variant */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu(null);
                        setViewingVariant(variant);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#4A423D] hover:text-[#7A2224] hover:bg-[#FBF3F2] rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Eye className="w-3.5 h-3.5 opacity-70" />
                      <span>View Product Variant</span>
                    </button>

                    {/* 2. Price Change */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu(null);
                        setEditingPriceVariant(variant);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#4A423D] hover:text-[#7A2224] hover:bg-[#FBF3F2] rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <IndianRupee className="w-3.5 h-3.5 opacity-70" />
                      <span>Price Change</span>
                    </button>

                    {/* 3. Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu(null);
                        setEditingVariant(variant);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#4A423D] hover:text-[#7A2224] hover:bg-[#FBF3F2] rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Pencil className="w-3.5 h-3.5 opacity-70" />
                      <span>Edit</span>
                    </button>

                    {/* Manage Images */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu(null);
                        setManagingImagesVariant(variant);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#4A423D] hover:text-[#7A2224] hover:bg-[#FBF3F2] rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <ImagesIcon className="w-3.5 h-3.5 opacity-70" />
                      <span>Manage Images</span>
                    </button>

                    <div className="my-1 border-t border-[#F1E8DE]" />

                    {/* 4. Make Inactive */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu(null);
                        setVariantToDeactivate(variant);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Make Inactive</span>
                    </button>

                    {/* 5. Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu(null);
                        setDeletingVariant(variant);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  /* INACTIVE: ONLY Make Active */
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenu(null);
                      setVariantToActivate(variant);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#1D7A44] hover:text-[#166035] hover:bg-[#E8F6EC] rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Make Active</span>
                  </button>
                )}
              </div>
            );
          })(),
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODALS AND DIALOGS                                                       */}
      {/* ========================================================================= */}

      {/* 1. Bulk Price Edit Modal (Existing & Enhanced) */}
      <ProductPriceEditModal
        open={isPriceEditOpen}
        onClose={() => setIsPriceEditOpen(false)}
        productUuid={canonicalProductId}
        productName={product.name}
        variants={variants}
        onSuccess={() => {
          setIsPriceEditOpen(false);
        }}
      />

      {/* 2. Single Variant Price Edit Modal */}
      <FormModal
        open={!!editingPriceVariant}
        onClose={() => setEditingPriceVariant(null)}
        title="Edit Variant Price"
        description={`Update base and sale price for ${editingPriceVariant?.variantName || "this variant"}`}
        size="sm"
      >
        {editingPriceVariant && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#F8F6F2] p-3.5 border border-[#EDE4D9] space-y-1">
              <div className="text-xs text-[#8A7F76]">SKU: {editingPriceVariant.sku}</div>
              <div className="text-xs font-semibold text-[#211C1A]">
                Measurement: {formatMeasurement(editingPriceVariant.measurement)}
              </div>
            </div>

            {singlePriceError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{singlePriceError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#211C1A] mb-1">
                  Base Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={singleBasePrice}
                  onChange={(e) => setSingleBasePrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CBBC] text-sm focus:outline-none focus:border-[#7A2224]"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#211C1A] mb-1">
                  Sale Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={singleSalePrice}
                  onChange={(e) => setSingleSalePrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8CBBC] text-sm focus:outline-none focus:border-[#7A2224]"
                  placeholder="e.g. 450"
                />
              </div>

              {parseFloat(singleBasePrice) > parseFloat(singleSalePrice) && (
                <div className="text-xs text-[#1D7A44] font-semibold bg-[#E8F6EC] p-2 rounded-lg">
                  Discount: ₹{(parseFloat(singleBasePrice) - parseFloat(singleSalePrice)).toFixed(2)} (
                  {Math.round(
                    ((parseFloat(singleBasePrice) - parseFloat(singleSalePrice)) /
                      parseFloat(singleBasePrice)) *
                      100
                  )}
                  % off)
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE4D9]">
              <button
                type="button"
                onClick={() => setEditingPriceVariant(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#D8CBBC] text-[#4A423D] hover:bg-[#F7F2EC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSinglePrice}
                disabled={updateVariantMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7A2224] hover:bg-[#5F1A1C] text-[#FFF6EC] cursor-pointer shadow-xs disabled:opacity-50"
              >
                {updateVariantMutation.isPending ? "Saving..." : "Save Price"}
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* 3. View Variant Details Modal */}
      <FormModal
        open={!!viewingVariant}
        onClose={() => setViewingVariant(null)}
        title="Variant Details"
        description={viewingVariant?.variantName}
        size="md"
      >
        {viewingVariant && (
          <div className="space-y-4">
            <div className="flex gap-4 items-center p-3.5 rounded-xl bg-[#F8F6F2] border border-[#EDE4D9]">
              <div className="w-16 h-16 rounded-lg bg-white border border-[#EDE4D9] relative overflow-hidden flex items-center justify-center shrink-0">
                {viewingVariant.primaryImage ? (
                  <Image
                    src={viewingVariant.primaryImage}
                    alt={viewingVariant.variantName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-[#A2968C] opacity-60" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[#211C1A] text-base truncate">
                  {viewingVariant.variantName}
                </h4>
                <div className="font-mono text-xs text-[#6B615A] mt-0.5">
                  SKU: {viewingVariant.sku}
                </div>
                <div className="font-mono text-[11px] text-[#A2968C]">
                  ID: {viewingVariant.id}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-[#EDE4D9] bg-white">
                <span className="text-[#8A7F76] font-medium block">Measurement</span>
                <span className="font-semibold text-[#211C1A] text-sm mt-0.5 block">
                  {formatMeasurement(viewingVariant.measurement)}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#EDE4D9] bg-white">
                <span className="text-[#8A7F76] font-medium block">Status</span>
                <span className="mt-1 block">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      viewingVariant.isActive
                        ? "bg-[#E8F6EC] text-[#1D7A44]"
                        : "bg-[#F7F2EC] text-[#7C7169]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        viewingVariant.isActive ? "bg-[#2AA35C]" : "bg-[#A2968C]"
                      }`}
                    />
                    {viewingVariant.isActive ? "Active" : "Inactive"}
                  </span>
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#EDE4D9] bg-white">
                <span className="text-[#8A7F76] font-medium block">Base Price</span>
                <span className="font-bold text-[#211C1A] text-sm mt-0.5 block">
                  ₹{viewingVariant.basePrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#EDE4D9] bg-white">
                <span className="text-[#8A7F76] font-medium block">Sale Price</span>
                <span className="font-bold text-[#1D7A44] text-sm mt-0.5 block">
                  ₹{viewingVariant.salePrice.toLocaleString("en-IN")}
                </span>
              </div>

              {viewingVariant.weightGrams !== undefined &&
                viewingVariant.weightGrams !== null && (
                  <div className="p-3 rounded-lg border border-[#EDE4D9] bg-white">
                    <span className="text-[#8A7F76] font-medium block">Weight in Grams</span>
                    <span className="font-semibold text-[#211C1A] text-sm mt-0.5 block">
                      {viewingVariant.weightGrams} g
                    </span>
                  </div>
                )}

              <div className="p-3 rounded-lg border border-[#EDE4D9] bg-white">
                <span className="text-[#8A7F76] font-medium block">Last Updated</span>
                <span className="font-medium text-[#211C1A] text-xs mt-0.5 block">
                  {viewingVariant.updatedAt
                    ? new Date(viewingVariant.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE4D9]">
              <button
                type="button"
                onClick={() => {
                  const target = viewingVariant;
                  setViewingVariant(null);
                  setManagingImagesVariant(target);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#EDE4D9] text-[#4A423D] hover:bg-[#FAF6F1] cursor-pointer transition-colors"
              >
                Manage Images
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingVariant;
                  setViewingVariant(null);
                  setEditingPriceVariant(target);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E3C8C4] text-[#7A2224] hover:bg-[#FBF3F2] cursor-pointer"
              >
                Edit Price
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingVariant;
                  setViewingVariant(null);
                  setEditingVariant(target);
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#7A2224] hover:bg-[#5F1A1C] text-[#FFF6EC] cursor-pointer shadow-xs"
              >
                Edit Details
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* 4. Edit Product Modal */}
      <FormModal
        open={isEditProductOpen}
        onClose={() => setIsEditProductOpen(false)}
        title="Edit Product"
        description={`Update information for ${product.name}`}
        size="lg"
      >
        <ProductForm
          initialData={{
            name: product.name,
            slug: product.slug,
            categoryId: product.categoryId || "",
            brandId: product.brandId || "",
            hsnCodeId: product.hsnCodeId || "",
            vegType: product.vegType || product.veg_type,
            isFeatured: Boolean(product.isFeatured),
            shortDescription: product.shortDescription || "",
            description: product.description || "",
          }}
          isEditing
          categories={categoryOptions}
          brands={brandOptions}
          hsnCodes={hsnOptions}
          isLoading={updateProductMutation.isPending}
          submitLabel="Save Changes"
          onSubmit={async (formData: ProductFormValues) => {
            try {
              await updateProductMutation.mutateAsync({
                uuid: canonicalProductId,
                data: formData as any,
              });
              setIsEditProductOpen(false);
            } catch (err: any) {
              console.error("Failed to update product", err);
            }
          }}
        />
      </FormModal>

      {/* 5. Add Variant Modal */}
      <FormModal
        open={isAddVariantOpen}
        onClose={() => setIsAddVariantOpen(false)}
        title="Add Variant"
        description={`Create a new variant for ${product.name}`}
        size="lg"
      >
        <VariantForm
          fixedProductId={canonicalProductId}
          units={unitOptions}
          isLoading={createVariantMutation.isPending}
          submitLabel="Create Variant"
          onSubmit={async (formData: VariantFormValues) => {
            try {
              await createVariantMutation.mutateAsync({
                productUuid: canonicalProductId,
                data: {
                  variantName: formData.variantName,
                  sku: formData.sku,
                  unitId: formData.unitId,
                  unitValue: Number(formData.unitValue),
                  basePrice: Number(formData.basePrice),
                  salePrice: Number(formData.salePrice),
                  weightGrams:
                    formData.weightGrams !== null && formData.weightGrams !== undefined
                      ? Number(formData.weightGrams)
                      : null,
                },
              });
              setIsAddVariantOpen(false);
            } catch (err: any) {
              console.error("Failed to create variant", err);
            }
          }}
        />
      </FormModal>

      {/* 6. Edit Full Variant Details Modal */}
      <FormModal
        open={!!editingVariant}
        onClose={() => setEditingVariant(null)}
        title="Edit Variant Details"
        description={`Modify configuration for ${editingVariant?.variantName}`}
        size="lg"
      >
        {editingVariant && (
          <VariantForm
            initialData={{
              variantName: editingVariant.variantName,
              sku: editingVariant.sku,
              unitId: "b32ce718-0ad4-47a6-819e-f09b60485abb" || "",
              unitValue: (editingVariant as any).measurement.value,
              basePrice: editingVariant.basePrice,
              salePrice: editingVariant.salePrice,
              weightGrams: (editingVariant as any).weightGrams ?? null,
            }}
            isEditing
            fixedProductId={canonicalProductId}
            units={unitOptions}
            isLoading={updateVariantMutation.isPending}
            submitLabel="Update Variant"
            onSubmit={async (formData: VariantFormValues) => {
              try {
                await updateVariantMutation.mutateAsync({
                  productUuid: canonicalProductId,
                  variantUuid: editingVariant.id,
                  data: {
                    variantName: formData.variantName,
                    sku: formData.sku,
                    unitId: formData.unitId,
                    unitValue: Number(formData.unitValue),
                    basePrice: Number(formData.basePrice),
                    salePrice: Number(formData.salePrice),
                    weightGrams:
                      formData.weightGrams !== null && formData.weightGrams !== undefined
                        ? Number(formData.weightGrams)
                        : null,
                  },
                });
                setEditingVariant(null);
              } catch (err: any) {
                console.error("Failed to update variant", err);
              }
            }}
          />
        )}
      </FormModal>

      {/* 7. Make Variant Inactive Confirmation Dialog */}
      <ConfirmDialog
        open={!!variantToDeactivate}
        onClose={() => setVariantToDeactivate(null)}
        onConfirm={async () => {
          if (!variantToDeactivate) return;
          const target = variantToDeactivate;
          setVariantToDeactivate(null);
          await handleMakeInactive(target);
        }}
        title="Make Variant Inactive?"
        description="Are you sure you want to make this product variant inactive?"
        confirmText="Make Inactive"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isStatusUpdating}
      />

      {/* 8. Make Variant Active Confirmation Dialog */}
      <ConfirmDialog
        open={!!variantToActivate}
        onClose={() => setVariantToActivate(null)}
        onConfirm={async () => {
          if (!variantToActivate) return;
          const target = variantToActivate;
          setVariantToActivate(null);
          await handleMakeActive(target);
        }}
        title="Make Variant Active?"
        description="Are you sure you want to make this product variant active?"
        confirmText="Make Active"
        cancelText="Cancel"
        variant="default"
        isLoading={isStatusUpdating}
      />

      {/* 9. Delete Variant Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingVariant}
        onClose={() => setDeletingVariant(null)}
        onConfirm={async () => {
          if (!deletingVariant) return;
          const target = deletingVariant;
          setDeletingVariant(null);
          try {
            await deleteVariantMutation.mutateAsync({
              productUuid: canonicalProductId,
              variantUuid: target.id,
            });
          } catch (err: any) {
            console.error("Failed to delete variant", err);
          }
        }}
        title="Delete Variant"
        description={`Are you sure you want to delete the variant "${deletingVariant?.variantName}" (${deletingVariant?.sku})? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteVariantMutation.isPending}
      />

      {/* 10. Manage Variant Images Modal */}
      <FormModal
        open={Boolean(managingImagesVariant)}
        onClose={() => setManagingImagesVariant(null)}
        title={`Manage Images: ${managingImagesVariant?.variantName || ""}`}
        description="Upload and crop product variant images (500 × 500 px)"
        size="lg"
      >
        {managingImagesVariant && (
          <VariantImageUploader
            productUuid={canonicalProductId}
            variantUuid={managingImagesVariant.id}
            variantName={managingImagesVariant.variantName}
            onFinish={() => {
              setManagingImagesVariant(null);
            }}
          />
        )}
      </FormModal>
    </div>
  );
}
