"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  useVariant,
  useVariants,
  useVariantImages,
  useUpdateVariant,
  useDeleteVariant,
} from "@/features/variants/hooks";
import { useUnits } from "@/features/units/hooks";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/common/FormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  VariantForm,
  VariantImageUploader,
  VariantCard,
  VariantCustomerPreviewModal,
  VariantPriceHistoryCard,
  VariantReviewsCard,
} from "@/features/variants/components";
import type { UnitFormItem } from "@/features/variants/components/VariantForm";
import type { AdminVariantResponse } from "@/features/variants/types";
import {
  Package,
  Pencil,
  Upload,
  Plus,
  Trash2,
  ImageIcon,
  Layers,
  Sparkles,
  Power,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminVariantDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawId = params?.id ? decodeURIComponent(params.id) : "";
  const variantId = rawId && rawId !== "undefined" ? rawId : "";
  const productIdParam = searchParams.get("productId") || "";

  // 1. Fallback Query if productId was not passed in search params
  const { data: variantsListResponse, isLoading: isLoadingList } = useVariants(
    !productIdParam && variantId ? { search: variantId, pageSize: 1 } : undefined,
    { enabled: !productIdParam && Boolean(variantId) }
  );

  const foundVariant = variantsListResponse?.data?.find(
    (v: AdminVariantResponse) => v.id === variantId || v.sku === variantId
  );

  const canonicalProductUuid =
    productIdParam || foundVariant?.productId || "";

  // 2. Main Variant Query
  const {
    data: variantResponse,
    isLoading: isLoadingVariant,
    error: variantError,
    refetch: refetchVariant,
  } = useVariant(canonicalProductUuid || null, variantId || null);

  const variant: AdminVariantResponse | null =
    (variantResponse as any)?.data ?? variantResponse ?? foundVariant ?? null;

  // 3. Variant Images Query
  const {
    data: images = [],
    isLoading: isLoadingImages,
    refetch: refetchImages,
  } = useVariantImages(canonicalProductUuid || null, variantId || null);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImageUploaderOpen, setIsImageUploaderOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // 4. Reference Units for the Edit Modal
  const { data: unitsData } = useUnits({ pageSize: 100 });
  const units = unitsData?.data ?? [];

  const matchedUnit = useMemo(() => {
    if (!variant?.measurement?.unit || units.length === 0) return null;
    const targetUnit = variant.measurement.unit.trim().toUpperCase();
    return (
      units.find(
        (u: any) =>
          u.code?.toUpperCase() === targetUnit ||
          u.name?.toUpperCase() === targetUnit ||
          u.id === variant.unitId
      ) || null
    );
  }, [units, variant]);

  const resolvedUnitId = variant?.unitId || matchedUnit?.id || "";

  const unitOptions = useMemo<UnitFormItem[]>(
    () =>
      units.map((u: any) => ({
        id: u.id,
        value: u.id,
        label: `${u.name} (${u.code})`,
        name: u.name,
        code: u.code,
        type: u.type,
        conversionFactor: u.conversionFactor ? Number(u.conversionFactor) : 1,
      })),
    [units]
  );

  // Mutation Hooks
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();

  // Delete Handler
  const handleDeleteVariant = async () => {
    if (!variant || !canonicalProductUuid) return;
    try {
      await deleteVariantMutation.mutateAsync({
        productUuid: canonicalProductUuid,
        variantUuid: variant.id,
      });
      setIsDeleteDialogOpen(false);
      router.push("/admin/dashboard/variants");
    } catch (err) {
      console.error("Failed to delete variant", err);
    }
  };

  // Toggle Active/Inactive Status Handler
  const handleToggleStatus = async () => {
    if (!variant || !canonicalProductUuid) return;
    try {
      await updateVariantMutation.mutateAsync({
        productUuid: canonicalProductUuid,
        variantUuid: variant.id,
        data: { isActive: !variant.isActive },
      });
      refetchVariant();
    } catch (err) {
      console.error("Failed to toggle variant status", err);
    }
  };

  const isLoading =
    (isLoadingVariant && !variant) ||
    (!productIdParam && isLoadingList && !foundVariant);

  if (isLoading) {
    return (
      <LoadingState
        text="Loading variant specifications, images and price history..."
      />
    );
  }

  if (variantError || !variant) {
    return (
      <ErrorState
        title="Variant not found"
        message={
          (variantError as any)?.message ||
          "The requested product variant could not be located or may have been deleted."
        }
        onRetry={() => {
          refetchVariant();
        }}
      />
    );
  }

  const measurementLabel = variant.measurement
    ? `${variant.measurement.value} ${variant.measurement.unit}`
    : "—";

  const attributes = [
    { label: "Product Name", value: variant.productName || "—" },
    { label: "Variant Name", value: variant.variantName || "—" },
    {
      label: "SKU Code",
      value: (
        <span className="font-mono text-xs font-bold text-neutral-700 bg-cream-100 px-2.5 py-1 rounded border border-cream-border">
          {variant.sku}
        </span>
      ),
    },
    { label: "Measurement", value: measurementLabel },
    {
      label: "Measurement Type",
      value: variant.measurement?.type ? (
        <span className="inline-flex px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 uppercase font-semibold text-xs text-neutral-600">
          {variant.measurement.type}
        </span>
      ) : (
        "—"
      ),
    },
    {
      label: "Base Price (MRP)",
      value: `₹${variant.basePrice?.toLocaleString("en-IN")}.00`,
    },
    {
      label: "Sale Price",
      value: (
        <span className="text-sm font-bold text-secondary-900 font-mono">
          ₹{variant.salePrice?.toLocaleString("en-IN")}.00
        </span>
      ),
    },
    {
      label: "Stock Availability",
      value: (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            !variant.outOfStock
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {!variant.outOfStock ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>In Stock{typeof variant.stock === "number" ? ` (${variant.stock} available)` : ""}</span>
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 text-rose-600" />
              <span>Out of Stock</span>
            </>
          )}
        </span>
      ),
    },
    {
      label: "Active Status",
      value: (
        <span
          className={`text-xs font-bold ${
            variant.isActive ? "text-emerald-700" : "text-neutral-500"
          }`}
        >
          {variant.isActive
            ? "Active (Available for purchase)"
            : "Inactive (Hidden from catalog)"}
        </span>
      ),
    },
    {
      label: "Created Date",
      value: variant.createdAt
        ? new Date(variant.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "—",
    },
    {
      label: "Last Updated",
      value: variant.updatedAt
        ? new Date(variant.updatedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "—",
    },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Top Header / Breadcrumbs Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-400">
          <Link
            href="/admin/dashboard/variants"
            className="hover:text-secondary-600 transition-colors"
          >
            Variants
          </Link>
          <span className="opacity-40">/</span>
          {variant.productName && canonicalProductUuid && (
            <>
              <Link
                href={`/admin/dashboard/products/${canonicalProductUuid}`}
                className="hover:text-secondary-600 transition-colors truncate max-w-[150px] sm:max-w-xs"
              >
                {variant.productName}
              </Link>
              <span className="opacity-40">/</span>
            </>
          )}
          <span className="text-neutral-900 font-semibold truncate max-w-[200px] sm:max-w-md">
            {variant.variantName}
          </span>
        </div>

        <Link
          href="/admin/dashboard/variants"
          className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-semibold bg-white border border-cream-border-subtle text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs"
        >
          Back to List
        </Link>
      </div>

      {/* Top Hero / Banner Card */}
      <section className="bg-white border border-cream-border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {/* Primary Image Thumbnail */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-cream-100 border border-cream-border overflow-hidden flex items-center justify-center shrink-0">
            {variant.primaryImage ? (
              <Image
                src={variant.primaryImage}
                alt={variant.variantName}
                fill
                className="object-cover"
              />
            ) : (
              <Package className="w-8 h-8 text-neutral-400 opacity-60" />
            )}
          </div>

          {/* Title & Metadata */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 truncate">
                {variant.variantName}
              </h1>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  variant.isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-cream-200 text-neutral-500 border border-cream-border"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    variant.isActive ? "bg-emerald-600" : "bg-neutral-400"
                  }`}
                />
                {variant.isActive ? "Active" : "Inactive"}
              </span>

              {/* Measurement Badge */}
              {variant.measurement?.value && (
                <span className="px-2.5 py-1 rounded-lg bg-cream-200 text-neutral-700 text-xs font-bold border border-cream-border-subtle">
                  {measurementLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-500">
              <span className="font-medium text-neutral-700">
                {variant.productName || "Product"}
              </span>
              <span className="opacity-30">·</span>
              <span className="font-mono text-neutral-600 bg-cream-100 px-2 py-0.5 rounded border border-cream-border">
                SKU: {variant.sku}
              </span>
              <span className="opacity-30">·</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  !variant.outOfStock
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {!variant.outOfStock ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>In Stock{typeof variant.stock === "number" ? ` (${variant.stock})` : ""}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Out of Stock</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              className="h-9 bg-white border-cream-border text-secondary-700 hover:bg-secondary-50 cursor-pointer"
              title="Storefront Customer View Preview"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-secondary-600" />
              <span>Customer Preview</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={updateVariantMutation.isPending}
              className={`h-9 bg-white border-cream-border cursor-pointer transition-colors ${
                variant.isActive
                  ? "text-neutral-700 hover:bg-neutral-50"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
              title={variant.isActive ? "Deactivate Variant" : "Activate Variant"}
            >
              <Power className="w-3.5 h-3.5 mr-1.5" />
              <span>{variant.isActive ? "Deactivate" : "Activate"}</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="h-9"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              <span>Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-9 w-9 text-red-600 hover:bg-red-50"
              title="Delete Variant"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </section>

      {/* Main 2-Column Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (lg:col-span-7): Pricing & Price History Card + Variant Attributes Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* Price History & Pricing Breakdown Card */}
          <VariantPriceHistoryCard variant={variant} />

          {/* Variant Attributes Technical Specifications Card */}
          <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4.5 border-b border-cream-border flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary-600" />
                <span>Item attributes</span>
              </h2>
            </div>

            <div className="divide-y divide-cream-border-subtle">
              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-6 py-3.5 items-center hover:bg-cream-50 transition-colors"
                >
                  <span className="sm:col-span-5 text-xs font-medium text-neutral-400">
                    {attr.label}
                  </span>
                  <div className="sm:col-span-7 text-xs sm:text-sm font-semibold text-neutral-900">
                    {attr.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-5): Images Card & Live Storefront Card Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Images Card */}
          <div className="bg-white border border-cream-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4.5 border-b border-cream-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-secondary-600" />
                <h2 className="text-[15px] font-bold text-neutral-900 tracking-tight">
                  Images
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cream-200 text-neutral-600 border border-cream-border">
                  {images.length || (variant.primaryImage ? 1 : 0)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImageUploaderOpen(true)}
                className="h-8 text-xs font-semibold text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Upload</span>
              </Button>
            </div>

            {/* Images Gallery */}
            {images.length > 0 ? (
              <div className="p-5 grid grid-cols-3 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative aspect-square rounded-xl bg-cream-100 border overflow-hidden group ${
                      img.isPrimary
                        ? "border-2 border-secondary-600 shadow-xs"
                        : "border-cream-border"
                    }`}
                  >
                    <Image
                      src={img.imageUrl}
                      alt={variant.variantName}
                      fill
                      className="object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center bg-secondary-600 text-cream-white text-[9px] font-bold tracking-wider uppercase px-1 py-0.5 rounded-md shadow-xs">
                        Primary
                      </span>
                    )}
                  </div>
                ))}

                {/* Add Image Tile */}
                <button
                  type="button"
                  onClick={() => setIsImageUploaderOpen(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-cream-border-hover hover:border-secondary-600 hover:bg-cream-100 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-secondary-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Add Image</span>
                </button>
              </div>
            ) : variant.primaryImage ? (
              <div className="p-5 grid grid-cols-3 gap-3">
                <div className="relative aspect-square rounded-xl bg-cream-100 border-2 border-secondary-600 overflow-hidden shadow-xs">
                  <Image
                    src={variant.primaryImage}
                    alt={variant.variantName}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center bg-secondary-600 text-cream-white text-[9px] font-bold tracking-wider uppercase px-1 py-0.5 rounded-md shadow-xs">
                    Primary
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImageUploaderOpen(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-cream-border-hover hover:border-secondary-600 hover:bg-cream-100 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-secondary-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Add Image</span>
                </button>
              </div>
            ) : (
              <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center text-neutral-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    No images uploaded yet
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Upload square photos (500 × 500 px)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImageUploaderOpen(true)}
                  className="mt-1"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  <span>Upload Images</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews & Ratings Section for this Variant */}
      <section>
        <VariantReviewsCard variant={variant} />
      </section>

      {/* 1. Edit Variant Details Modal */}
      <FormModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Variant Details"
        description={`Update information and configuration for ${variant.variantName}`}
        size="lg"
      >
        <VariantForm
          initialData={{
            variantName: variant.variantName,
            sku: variant.sku,
            slug: variant.slug || "",
            unitId: resolvedUnitId,
            unitValue:
              variant.unitValue ??
              (typeof variant.measurement?.value === "number"
                ? variant.measurement.value
                : Number(variant.measurement?.value) || 1),
            basePrice: variant.basePrice,
            salePrice: variant.salePrice,
            inStock: !variant.outOfStock,
            outOfStock: variant.outOfStock,
          }}
          isEditing
          fixedProductId={canonicalProductUuid}
          units={unitOptions}
          isLoading={updateVariantMutation.isPending}
          submitLabel="Save Changes"
          onSubmit={async (formData) => {
            try {
              await updateVariantMutation.mutateAsync({
                productUuid: canonicalProductUuid,
                variantUuid: variant.id,
                data: {
                  variantName: formData.variantName,
                  sku: formData.sku,
                  slug: formData.slug,
                  unitId: formData.unitId,
                  unitValue: Number(formData.unitValue),
                  basePrice: Number(formData.basePrice),
                  salePrice: Number(formData.salePrice),
                  outOfStock: !formData.inStock,
                },
              });
              setIsEditModalOpen(false);
              refetchVariant();
            } catch (err) {
              console.error("Failed to update variant", err);
            }
          }}
        />
      </FormModal>

      {/* 2. Manage Images Modal */}
      <FormModal
        open={isImageUploaderOpen}
        onClose={() => setIsImageUploaderOpen(false)}
        title={`Manage Images: ${variant.variantName}`}
        description="Upload and crop product variant photos (500 × 500 px)"
        size="lg"
      >
        <VariantImageUploader
          productUuid={canonicalProductUuid}
          variantUuid={variant.id}
          variantName={variant.variantName}
          onFinish={() => {
            setIsImageUploaderOpen(false);
            refetchImages();
            refetchVariant();
          }}
        />
      </FormModal>

      {/* 3. Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteVariant}
        title="Delete Variant"
        description={`Are you sure you want to delete the variant "${variant.variantName}" (${variant.sku})? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteVariantMutation.isPending}
      />

      {/* 4. Customer View Live Card Preview Modal */}
      <VariantCustomerPreviewModal
        variant={variant}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
}
