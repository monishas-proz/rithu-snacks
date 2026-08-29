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

  const isLoading =
    (isLoadingVariant && !variant) ||
    (!productIdParam && isLoadingList && !foundVariant);

  if (isLoading) {
    return <LoadingState text="Loading variant details..." />;
  }

  if (variantError || !variant) {
    return (
      <ErrorState
        message="Variant not found or failed to load"
        onRetry={() => {
          refetchVariant();
        }}
      />
    );
  }

  const measurementLabel = variant.measurement
    ? `${variant.measurement.value} ${variant.measurement.unit}`
    : "—";

  const discountPercent =
    variant.basePrice > variant.salePrice
      ? Math.round(
          ((variant.basePrice - variant.salePrice) / variant.basePrice) * 100
        )
      : 0;

  const attributes = [
    { label: "Product Name", value: variant.productName || "—" },
    { label: "Variant Name", value: variant.variantName || "—" },
    {
      label: "SKU Code",
      value: (
        <span className="font-mono text-xs font-bold text-[#4A423D] bg-[#F8F6F2] px-2.5 py-1 rounded border border-[#EDE4D9]">
          {variant.sku}
        </span>
      ),
    },
    { label: "Measurement", value: measurementLabel },
    {
      label: "Measurement Type",
      value: variant.measurement?.type ? (
        <span className="inline-flex px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 uppercase font-semibold text-xs text-[#6B615A]">
          {variant.measurement.type}
        </span>
      ) : (
        "—"
      ),
    },
    {
      label: "Base Price",
      value: `₹${variant.basePrice?.toLocaleString("en-IN")}`,
    },
    {
      label: "Sale Price",
      value: (
        <span className="text-sm font-bold text-[#1D7A44]">
          ₹{variant.salePrice?.toLocaleString("en-IN")}
        </span>
      ),
    },
    // {
    //   label: "Discount Savings",
    //   value:
    //     variant.basePrice > variant.salePrice ? (
    //       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E8F6EC] text-[#1D7A44] font-bold border border-[#C8EAD1]">
    //         <span>
    //           ₹{(variant.basePrice - variant.salePrice).toLocaleString("en-IN")}
    //         </span>
    //         <span>({discountPercent}% off)</span>
    //       </span>
    //     ) : (
    //       <span className="text-[#A2968C]">No discount active</span>
    //     ),
    // },
    // {
    //   label: "Weight in Grams",
    //   value: variant.weightGrams ? `${variant.weightGrams} g` : "—",
    // },
    {
      label: "Active Status",
      value: (
        <span
          className={`text-xs font-bold ${
            variant.isActive ? "text-[#1D7A44]" : "text-[#7C7169]"
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
          })
        : "—",
    },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Top Header / Breadcrumbs Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#8A7F76]">
          <Link
            href="/admin/dashboard/variants"
            className="hover:text-[#7A2224] transition-colors"
          >
            Variants
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-[#211C1A] font-semibold truncate max-w-[200px] sm:max-w-md">
            {variant.variantName}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8 text-xs font-semibold bg-white border-[#EBE1D6]"
        >
          <Link href="/admin/dashboard/variants">Back to List</Link>
        </Button>
      </div>

      {/* Top Hero / Banner Card */}
      <section className="bg-white border border-[#EDE4D9] rounded-2xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(64,16,15,0.02)] flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {/* Primary Image Thumbnail */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#F8F6F2] border border-[#EDE4D9] overflow-hidden flex items-center justify-center shrink-0">
            {variant.primaryImage ? (
              <Image
                src={variant.primaryImage}
                alt={variant.variantName}
                fill
                className="object-cover"
              />
            ) : (
              <Package className="w-8 h-8 text-[#A2968C] opacity-60" />
            )}
          </div>

          {/* Title & Metadata */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#211C1A] truncate">
                {variant.variantName}
              </h1>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  variant.isActive
                    ? "bg-[#E8F6EC] text-[#1D7A44] border border-[#C8EAD1]"
                    : "bg-[#F7F2EC] text-[#7C7169] border border-[#EDE4D9]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    variant.isActive ? "bg-[#2AA35C]" : "bg-[#A2968C]"
                  }`}
                />
                {variant.isActive ? "Active" : "Inactive"}
              </span>

              {/* Measurement Badge */}
              {variant.measurement?.value && (
                <span className="px-2.5 py-1 rounded-lg bg-[#F7F2EC] text-[#5C534C] text-xs font-bold border border-[#E4D9CD]">
                  {measurementLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-[#7C7169]">
              <span className="font-medium text-[#4A423D]">
                {variant.productName || "Product"}
              </span>
              <span className="opacity-30">·</span>
              <span className="font-mono text-[#6B615A] bg-[#F8F6F2] px-2 py-0.5 rounded border border-[#EDE4D9]">
                SKU: {variant.sku}
              </span>
              <span className="opacity-30">·</span>
              {/* <span className="font-mono text-[#A2968C]">
                ID: {variant.id}
              </span> */}
            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImageUploaderOpen(true)}
              className="h-9 border-[#E4D9CD] text-[#4A423D]"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              <span>Manage Images</span>
            </Button> */}

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

        {/* Content Section: Attributes (Left) and Images (Right) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Variant Attributes Card */}
          <div className="lg:col-span-7 bg-white border border-[#EDE4D9] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(64,16,15,0.02)]">
            <div className="px-6 py-4.5 border-b border-[#F1E8DE] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#211C1A] tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7A2224]" />
                <span>Variant attributes</span>
              </h2>
              <span className="text-xs text-[#8A7F76]">
                Technical specifications & values
              </span>
            </div>

            <div className="divide-y divide-[#F6F0E9]">
              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-6 py-3.5 items-center hover:bg-[#FCFAF7] transition-colors"
                >
                  <span className="sm:col-span-4 text-xs font-medium text-[#8A7F76]">
                    {attr.label}
                  </span>
                  <div className="sm:col-span-8 text-sm font-semibold text-[#211C1A]">
                    {attr.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Images Card */}
          <div className="lg:col-span-5 bg-white border border-[#EDE4D9] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(64,16,15,0.02)]">
            <div className="px-6 py-4.5 border-b border-[#F1E8DE] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-[#211C1A] tracking-tight flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#7A2224]" />
                  <span>Images</span>
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F7F2EC] text-[#6B615A] border border-[#EDE4D9]">
                  {images.length || (variant.primaryImage ? 1 : 0)}
                </span>
              </div>

              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImageUploaderOpen(true)}
                className="text-xs font-bold text-[#7A2224] hover:text-[#5F1A1C] hover:bg-[#FBF3F2] h-8 px-2.5"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Upload / Manage</span>
              </Button> */}
            </div>

            {/* Images Gallery */}
            {images.length > 0 ? (
              <div className="p-5 grid grid-cols-3 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative aspect-square rounded-xl bg-[#F8F6F2] border overflow-hidden group ${
                      img.isPrimary
                        ? "border-2 border-[#7A2224] shadow-xs"
                        : "border-[#EDE4D9]"
                    }`}
                  >
                    <Image
                      src={img.imageUrl}
                      alt={variant.variantName}
                      fill
                      className="object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center bg-[#7A2224] text-[#FFF6EC] text-[9px] font-bold tracking-wider uppercase px-1 py-0.5 rounded-md shadow-xs">
                        Primary
                      </span>
                    )}
                  </div>
                ))}

                {/* Add Image Tile */}
                <button
                  type="button"
                  onClick={() => setIsImageUploaderOpen(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#D8CBBC] hover:border-[#7A2224] hover:bg-[#FAF6F1] flex flex-col items-center justify-center gap-1 text-[#A2968C] hover:text-[#7A2224] transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Add Image</span>
                </button>
              </div>
            ) : variant.primaryImage ? (
              <div className="p-5 grid grid-cols-3 gap-3">
                <div className="relative aspect-square rounded-xl bg-[#F8F6F2] border-2 border-[#7A2224] overflow-hidden shadow-xs">
                  <Image
                    src={variant.primaryImage}
                    alt={variant.variantName}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center bg-[#7A2224] text-[#FFF6EC] text-[9px] font-bold tracking-wider uppercase px-1 py-0.5 rounded-md shadow-xs">
                    Primary
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImageUploaderOpen(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#D8CBBC] hover:border-[#7A2224] hover:bg-[#FAF6F1] flex flex-col items-center justify-center gap-1 text-[#A2968C] hover:text-[#7A2224] transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Add Image</span>
                </button>
              </div>
            ) : (
              <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#F7F2EC] flex items-center justify-center text-[#A2968C]">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#211C1A]">
                    No images uploaded yet
                  </p>
                  <p className="text-[11px] text-[#8A7F76] mt-0.5">
                    Upload square product photos (500 × 500 px)
                  </p>
                </div>
                <Button
                  variant="destructive"
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
            unitId: resolvedUnitId,
            unitValue:
              variant.unitValue ??
              (typeof variant.measurement?.value === "number"
                ? variant.measurement.value
                : Number(variant.measurement?.value) || 1),
            basePrice: variant.basePrice,
            salePrice: variant.salePrice,
            weightGrams: variant.weightGrams ?? null,
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
                  unitId: formData.unitId,
                  unitValue: Number(formData.unitValue),
                  basePrice: Number(formData.basePrice),
                  salePrice: Number(formData.salePrice),
                  weightGrams: formData.weightGrams
                    ? Number(formData.weightGrams)
                    : null,
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
    </div>
  );
}
