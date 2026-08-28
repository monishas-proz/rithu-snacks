"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "@/features/variants/hooks";
import { useProducts } from "@/features/products/hooks";
import { useUnits } from "@/features/units/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { SearchInput } from "@/components/ui/search-input";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Check,
  ImageIcon,
  Eye,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminVariantResponse } from "@/features/variants/types";
import {
  VariantForm,
  VariantImageUploader,
} from "@/features/variants/components";

export default function AdminVariantsPage() {
  const [search, setSearch] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] =
    useState<string>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteTarget, setDeleteTarget] = useState<{
    productUuid: string;
    variantUuid: string;
  } | null>(null);

  // Add Stepper State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [createdVariant, setCreatedVariant] = useState<{
    id: string;
    productId: string;
    name: string;
  } | null>(null);

  // Edit State & Tabs
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<"details" | "images">("details");
  const [selectedVariant, setSelectedVariant] =
    useState<AdminVariantResponse | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, selectedProductFilter]);

  // Main Variants Query
  const { data, isLoading, error, refetch } = useVariants({
    page,
    pageSize,
    search: search || undefined,
    productIds: selectedProductFilter ? [selectedProductFilter] : undefined,
  });

  // Reference queries
  const { data: productsData } = useProducts({ pageSize: 100 });
  const { data: unitsData } = useUnits({ pageSize: 100 });

  const createMutation = useCreateVariant();
  const updateMutation = useUpdateVariant();
  const deleteMutation = useDeleteVariant();

  const variants = data?.data ?? [];
  const products = productsData?.data ?? [];
  const units = unitsData?.data ?? [];

  // Options for form dropdowns & filter
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }, [products]);

  const productFilterOptions = useMemo(() => {
    return [
      { value: "", label: "All Products" },
      ...productOptions,
    ];
  }, [productOptions]);

  const columns: ColumnDef<AdminVariantResponse>[] = [
    {
      accessorKey: "primaryImage",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.original.primaryImage;
        return (
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={row.original.variantName || "Variant"}
                fill
                className="object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-[var(--color-neutral-400)]" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-[var(--color-neutral-900)]">
            {row.original.productName || "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "variantName",
      header: "Variant & SKU",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[var(--color-neutral-900)]">
            {row.original.variantName || "—"}
          </p>
          <p className="text-xs text-[var(--color-neutral-500)] mt-0.5 font-mono">
            {row.original.sku}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "measurement",
      header: "Measurement",
      cell: ({ row }) => {
        const m = row.original.measurement;
        if (!m) return <span className="text-[var(--color-neutral-400)]">—</span>;
        const typeBadgeStyles =
          m.type === "weight"
            ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-200)]"
            : m.type === "volume"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-amber-50 text-amber-700 border-amber-200";

        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-neutral-800)]">
              {m.value} {m.unit}
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${typeBadgeStyles}`}
            >
              {m.type}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "basePrice",
      header: "Base Price",
      cell: ({ row }) => (
        <span className="text-[var(--color-neutral-600)]">
          ₹{row.original.basePrice}
        </span>
      ),
    },
    {
      accessorKey: "salePrice",
      header: "Sale Price",
      cell: ({ row }) => (
        <span className="font-semibold text-[var(--color-success-700)]">
          ₹{row.original.salePrice}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            title="View Variant"
          >
            <Link
              href={`/admin/dashboard/variants/${row.original.id}?productId=${row.original.productId}`}
            >
              <Eye className="h-4 w-4 text-[var(--color-neutral-500)]" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Edit Variant"
            onClick={() => {
              setSelectedVariant(row.original);
              setEditTab("details");
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-[var(--color-neutral-500)]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Delete Variant"
            onClick={() =>
              setDeleteTarget({
                productUuid: row.original.productId,
                variantUuid: row.original.id,
              })
            }
          >
            <Trash2 className="h-4 w-4 text-[var(--color-error-600)]" />
          </Button>
        </div>
      ),
    },
  ];

  const handleCloseCreateModal = () => {
    setIsCreateOpen(false);
    setCreateStep(1);
    setCreatedVariant(null);
    refetch();
  };

  if (isLoading && !data) {
    return <LoadingState text="Loading product variants..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load product variants"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminPageHeader
        title="Product Variant Management"
        description="Manage product variants, sizing, packaging, pricing, SKUs, and images."
      />

      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] py-1 rounded-2xl">
          <div className="flex-shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                placeholder="Search variants by name, SKU..."
                defaultValue={search}
                onSearch={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                className="w-full max-w-md"
              />

              <div className="w-full sm:w-64">
                <Select
                  value={selectedProductFilter}
                  onChange={(e) => setSelectedProductFilter(e.target.value)}
                  options={productFilterOptions}
                  placeholder="All Products"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                setCreateStep(1);
                setCreatedVariant(null);
                setIsCreateOpen(true);
              }}
              className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          </div>

          <div className="mt-6 flex-1 min-h-0 overflow-hidden flex flex-col">
            <DataTable
              columns={columns}
              data={variants}
              pageSize={pageSize}
              page={data?.meta?.page ?? page}
              totalPages={data?.meta?.totalPages ?? 1}
              totalItems={data?.meta?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setPage(1);
              }}
              className="bg-white"
            />
          </div>
        </div>
      </AdminContent>

      {/* CREATE MODAL WITH STEPPER */}
      <FormModal
        open={isCreateOpen}
        onClose={handleCloseCreateModal}
        title={
          createStep === 1
            ? "Add Product Variant"
            : `Add Images: ${createdVariant?.name || "Variant"}`
        }
        description={
          createStep === 1
            ? "Step 1 of 2: Enter variant specifications and pricing"
            : "Step 2 of 2: Upload up to 4 images for this variant"
        }
        size="lg"
      >
        {/* Stepper Progress Bar */}
        <div className="mb-6 flex items-center justify-center gap-3 border-b border-[var(--color-neutral-200)] pb-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              createStep === 1
                ? "bg-[var(--color-secondary-600)] text-white shadow"
                : "bg-[var(--color-success-100)] text-[var(--color-success-700)]"
            }`}
          >
            {createStep > 1 ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <span>1</span>
            )}
            <span>Variant Details</span>
          </div>

          <span className="text-xs text-[var(--color-neutral-400)]">→</span>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              createStep === 2
                ? "bg-[var(--color-secondary-600)] text-white shadow"
                : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]"
            }`}
          >
            <span>2</span>
            <span>Variant Images</span>
          </div>
        </div>

        {createStep === 1 && (
          <VariantForm
            products={productOptions}
            units={units}
            isLoading={createMutation.isPending}
            submitLabel="Next: Upload Images"
            onSubmit={async (formData) => {
              const payload = {
                variantName: formData.variantName,
                sku: formData.sku,
                unitId: formData.unitId,
                unitValue: Number(formData.unitValue),
                basePrice: Number(formData.basePrice),
                salePrice: Number(formData.salePrice),
                // weightGrams:
                //   formData.weightGrams !== null &&
                //   formData.weightGrams !== undefined
                //     ? Number(formData.weightGrams)
                //     : null,
              };

              const res = await createMutation.mutateAsync({
                productUuid: formData.productId!,
                data: payload,
              });

              if (res && res.data) {
                setCreatedVariant({
                  id: res.data.id,
                  productId: res.data.productId,
                  name: res.data.variantName || formData.variantName,
                });
                setCreateStep(2);
              }
            }}
          />
        )}

        {createStep === 2 && createdVariant && (
          <VariantImageUploader
            productUuid={createdVariant.productId}
            variantUuid={createdVariant.id}
            variantName={createdVariant.name}
            isStepperMode={true}
            onFinish={handleCloseCreateModal}
            onSkip={handleCloseCreateModal}
          />
        )}
      </FormModal>

      {/* EDIT MODAL */}
      <FormModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedVariant(null);
          refetch();
        }}
        title={`Update Variant: ${selectedVariant?.variantName || ""}`}
        description="Update variant details or manage product images"
        size="lg"
      >
        {selectedVariant && (
          <div>
            {/* Tabs for Details vs Images */}
            <div className="flex border-b border-[var(--color-neutral-200)] mb-6">
              <button
                type="button"
                onClick={() => setEditTab("details")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  editTab === "details"
                    ? "border-[var(--color-secondary-600)] text-[var(--color-secondary-600)]"
                    : "border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)]"
                }`}
              >
                <Package className="h-4 w-4" />
                Variant Details
              </button>

              <button
                type="button"
                onClick={() => setEditTab("images")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  editTab === "images"
                    ? "border-[var(--color-secondary-600)] text-[var(--color-secondary-600)]"
                    : "border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)]"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Manage Images
              </button>
            </div>

            {editTab === "details" ? (
              <VariantForm
                initialData={{
                  productId: selectedVariant.productId,
                  variantName: selectedVariant.variantName,
                  sku: selectedVariant.sku,
                  unitId:
                    units.find(
                      (u) =>
                        u.code?.toLowerCase() ===
                          selectedVariant.measurement?.unit?.toLowerCase() ||
                        u.name?.toLowerCase() ===
                          selectedVariant.measurement?.unit?.toLowerCase() ||
                        u.id === selectedVariant.unitId
                    )?.id ||
                    selectedVariant.unitId ||
                    "",
                  unitValue:
                    selectedVariant.measurement?.value ??
                    selectedVariant.unitValue,
                  basePrice: selectedVariant.basePrice,
                  salePrice: selectedVariant.salePrice,
                  weightGrams: selectedVariant.weightGrams,
                }}
                isEditing
                fixedProductId={selectedVariant.productId}
                products={productOptions}
                units={units}
                isLoading={updateMutation.isPending}
                submitLabel="Update Details"
                onSubmit={async (formData) => {
                  const payload = {
                    variantName: formData.variantName,
                    sku: formData.sku,
                    unitId: formData.unitId,
                    unitValue: Number(formData.unitValue),
                    basePrice: Number(formData.basePrice),
                    salePrice: Number(formData.salePrice),
                    // weightGrams:
                    //   formData.weightGrams !== null &&
                    //   formData.weightGrams !== undefined
                    //     ? Number(formData.weightGrams)
                    //     : null,
                  }; 

                  await updateMutation.mutateAsync({
                    productUuid: selectedVariant.productId,
                    variantUuid: selectedVariant.id,
                    data: payload,
                  });

                  setIsEditOpen(false);
                  setSelectedVariant(null);
                  refetch();
                }}
              />
            ) : (
              <VariantImageUploader
                productUuid={selectedVariant.productId}
                variantUuid={selectedVariant.id}
                variantName={selectedVariant.variantName}
                onFinish={() => {
                  refetch();
                }}
              />
            )}
          </div>
        )}
      </FormModal>

      {/* DELETE DIALOG */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        title="Delete Product Variant"
        description="Are you sure you want to delete this product variant? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
