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
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { SearchInput } from "@/components/ui/search-input";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminProductResponse } from "@/features/products/types";
import { ProductForm } from "@/features/products/components/ProductForm";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<AdminProductResponse | null>(null);

  // Main Products Query (filtered by search and selected category)
  const { data, isLoading, error, refetch } = useProducts({
    page,
    pageSize,
    search: search || undefined,
    categoryId: selectedCategoryFilter || undefined,
  });

  // Reference queries for categories filter & modal form dropdowns
  const isModalOpen = isCreateOpen || isEditOpen;
  const { data: categoriesData } = useCategories({ pageSize: 100 });
  const { data: brandsData } = useBrands(
    { limit: 100 },
    { enabled: isModalOpen }
  );
  const { data: hsnData } = useHsnCodes(
    { pageSize: 100 },
    { enabled: isModalOpen }
  );

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const products = data?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const brands = brandsData?.data ?? [];
  const hsnCodes = hsnData?.data ?? [];

  // Filter Options for category dropdown in toolbar
  const categoryFilterOptions = useMemo(() => {
    return [
      { value: "", label: "All Categories" },
      ...categories.map((c: any) => ({
        value: String(c.uuid || c.id),
        label: c.name,
      })),
    ];
  }, [categories]);

  // Options for form dropdowns (used only when modal is open)
  const categoryOptions = useMemo(() => {
    return categories.map((c: any) => ({
      value: String(c.id || c.uuid),
      label: c.name,
      slug: c.slug,
    }));
  }, [categories]);

  const brandOptions = useMemo(() => {
    return brands.map((b: any) => ({
      value: b.uuid || String(b.id),
      label: b.name,
      slug: b.slug,
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
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-[var(--color-neutral-700)]">
          {row.original.categoryName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "brandName",
      header: "Brand",
      cell: ({ row }) => (
        <span className="text-[var(--color-neutral-700)]">
          {row.original.brandName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "hsnCodeName",
      header: "HSN Code",
      cell: ({ row }) => (
        <span className="font-medium text-[var(--color-neutral-700)]">
          {row.original.hsnCodeName || "—"}
        </span>
      ),
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
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/dashboard/products/${row.original.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:text-secondary-600 hover:bg-neutral-100 transition-colors"
            title="View Product Details"
          >
            <Eye className="h-4 w-4" />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedProduct(row.original);
              setIsEditOpen(true);
            }}
            title="Edit Product"
          >
            <Pencil className="h-4 w-4 text-[var(--color-neutral-500)]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
            title="Delete Product"
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
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                placeholder="Search products..."
                defaultValue={search}
                onSearch={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                className="w-full max-w-md"
              />

              <div className="w-full sm:w-64">
                <Select
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  options={categoryFilterOptions}
                  placeholder="All Categories"
                  className="h-11 rounded-xl"
                />
              </div>
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
              pageSizeOptions={[10, 20, 30, 50]}
              page={data?.meta?.page ?? page}
              totalPages={data?.meta?.totalPages ?? Math.max(1, Math.ceil((data?.meta?.total ?? products.length) / pageSize))}
              totalItems={data?.meta?.total ?? products.length}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
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
