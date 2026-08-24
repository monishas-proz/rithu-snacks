"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/features/products/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useBrands } from "@/features/brands/hooks";
import { useHsnCodes } from "@/features/hsn-codes/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminProductResponse } from "@/features/products/types";
import { ProductForm } from "@/features/products/components/ProductForm";

export default function AdminProductsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<AdminProductResponse | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Main Products Query
  const { data, isLoading, error, refetch } = useProducts({
    page,
    pageSize,
    search: search || undefined,
  });

  // Reference queries for relations
  const { data: categoriesData } = useCategories({ pageSize: 100 });
  const { data: brandsData } = useBrands({ limit: 100 });
  const { data: hsnData } = useHsnCodes({ pageSize: 100 });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const products = data?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const brands = brandsData?.data ?? [];
  const hsnCodes = hsnData?.data ?? [];

  // Mappings for table lookup
  const categoryMap = useMemo(() => {
    return new Map(
      categories.map((c) => [String(c.id), c.name])
    );
  }, [categories]);

  const brandMap = useMemo(() => {
    return new Map(
      brands.map((b) => [b.uuid || String(b.id), b.name])
    );
  }, [brands]);

  const hsnMap = useMemo(() => {
    return new Map(
      hsnCodes.map((h) => [h.id, h.code])
    );
  }, [hsnCodes]);

  // Options for form dropdowns
  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({
      value: String(c.id),
      label: c.name,
    }));
  }, [categories]);

  const brandOptions = useMemo(() => {
    return brands.map((b) => ({
      value: b.uuid || String(b.id),
      label: b.name,
    }));
  }, [brands]);

  const hsnOptions = useMemo(() => {
    return hsnCodes.map((h) => ({
      value: h.id,
      label: `${h.code}${h.description ? ` (${h.description})` : ""}`,
    }));
  }, [hsnCodes]);

  const columns: ColumnDef<AdminProductResponse>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-[var(--color-neutral-900)]">
            {row.original.name}
          </p>
          <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
            {row.original.slug}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const catName = row.original.categoryId
          ? categoryMap.get(row.original.categoryId)
          : null;
        return (
          <span className="text-[var(--color-neutral-700)]">
            {catName || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "brandId",
      header: "Brand",
      cell: ({ row }) => {
        const brandName = row.original.brandId
          ? brandMap.get(row.original.brandId)
          : null;
        return (
          <span className="text-[var(--color-neutral-700)]">
            {brandName || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "hsnCodeId",
      header: "HSN Code",
      cell: ({ row }) => {
        const hsnCode = row.original.hsnCodeId
          ? hsnMap.get(row.original.hsnCodeId)
          : null;
        return (
          <span className="font-medium text-[var(--color-neutral-700)]">
            {hsnCode || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "vegType",
      header: "Type",
      cell: ({ row }) => {
        const vegType = row.original.vegType;
        switch (vegType) {
          case "veg":
            return (
              <span className="inline-flex items-center rounded-full bg-[var(--color-success-50)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success-700)]">
                Veg
              </span>
            );
          case "nonveg":
            return (
              <span className="inline-flex items-center rounded-full bg-[var(--color-error-50)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-error-700)]">
                Non-Veg
              </span>
            );
          case "vegan":
            return (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Vegan
              </span>
            );
          default:
            return (
              <span className="inline-flex items-center rounded-full bg-[var(--color-neutral-100)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">
                N/A
              </span>
            );
        }
      },
    },
    {
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) =>
        row.original.isFeatured ? (
          <span className="inline-flex items-center rounded-full bg-[var(--color-info-50)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-info-700)]">
            Featured
          </span>
        ) : (
          <span className="text-[var(--color-neutral-400)]">—</span>
        ),
    },
    // {
    //   accessorKey: "createdAt",
    //   header: "Created Date",
    //   cell: ({ row }) => (
    //     <span className="text-[var(--color-neutral-700)]">
    //       {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
    //     </span>
    //   ),
    // },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedProduct(row.original);
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-[var(--color-neutral-500)]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-[var(--color-error-600)]" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading && !data) {
    return <LoadingState text="Loading products..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load products"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminPageHeader
        title="Product Management"
        description="Manage your product catalog, categories, brands, and taxes."
      />

      <AdminContent className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] py-1 rounded-2xl">
          <div className="flex-shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-400)]" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--color-neutral-300)] bg-white pl-11 pr-4 text-sm text-[var(--color-neutral-900)] outline-none transition-all focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
              />
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          <div className="mt-6 flex-1 min-h-0 overflow-hidden flex flex-col">
            <DataTable
              columns={columns}
              data={products}
              pageSize={pageSize}
              page={data?.meta?.page ?? page}
              totalPages={data?.meta?.totalPages ?? 1}
              totalItems={data?.meta?.total ?? 0}
              onPageChange={setPage}
              className="bg-white"
            />
          </div>
        </div>
      </AdminContent>

      {/* CREATE MODAL */}
      <FormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Product"
        description="Create a new product"
        size="lg"
      >
        <ProductForm
          categories={categoryOptions}
          brands={brandOptions}
          hsnCodes={hsnOptions}
          isLoading={createMutation.isPending}
          submitLabel="Create Product"
          onSubmit={async (formData) => {
            const payload = {
              name: formData.name,
              slug: formData.slug,
              categoryId: formData.categoryId,
              brandId: formData.brandId,
              hsnCodeId: formData.hsnCodeId,
              vegType: formData.vegType,
              isFeatured: formData.isFeatured,
              shortDescription: formData.shortDescription || null,
              description: formData.description || null,
            };

            await createMutation.mutateAsync(payload);
            setIsCreateOpen(false);
          }}
        />
      </FormModal>

      {/* EDIT MODAL */}
      <FormModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedProduct(null);
        }}
        title="Update Product"
        description="Update the selected product"
        size="lg"
      >
        {selectedProduct && (
          <ProductForm
            initialData={{
              name: selectedProduct.name,
              slug: selectedProduct.slug,
              categoryId: selectedProduct.categoryId || "",
              brandId: selectedProduct.brandId || "",
              hsnCodeId: selectedProduct.hsnCodeId || "",
              vegType: selectedProduct.vegType,
              isFeatured: selectedProduct.isFeatured,
              shortDescription: selectedProduct.shortDescription || "",
              description: selectedProduct.description || "",
            }}
            isEditing
            categories={categoryOptions}
            brands={brandOptions}
            hsnCodes={hsnOptions}
            isLoading={updateMutation.isPending}
            submitLabel="Update Product"
            onSubmit={async (formData) => {
              const payload = {
                name: formData.name,
                slug: formData.slug,
                categoryId: formData.categoryId,
                brandId: formData.brandId,
                hsnCodeId: formData.hsnCodeId,
                vegType: formData.vegType,
                isFeatured: formData.isFeatured,
                shortDescription: formData.shortDescription || null,
                description: formData.description || null,
              };

              await updateMutation.mutateAsync({
                uuid: selectedProduct.id,
                data: payload,
              });

              setIsEditOpen(false);
              setSelectedProduct(null);
              refetch();
            }}
          />
        )}
      </FormModal>

      {/* DELETE DIALOG */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => setDeleteId(null),
            });
          }
        }}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
