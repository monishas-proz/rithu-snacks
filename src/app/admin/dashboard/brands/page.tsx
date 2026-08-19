"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/features/brands/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
// import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { BrandListItem } from "@/features/brands/types";
import { BrandForm } from "@/features/brands/components/BrandForm";

export default function AdminBrandsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandListItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useBrands({
    search: search || undefined,
  });

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const brands = data?.data ?? [];

  const columns: ColumnDef<BrandListItem, unknown>[] = [
  // {
  //   id: "logo",
  //   header: "Logo",
  //   cell: ({ row }) => (
  //     <div className="h-12 w-12 overflow-hidden rounded-xl bg-[var(--color-neutral-100)]">
  //       <Image
  //         src={row.original.icon || "/images/category_img.png"}
  //         alt={row.original.name}
  //         width={48}
  //         height={48}
  //         className="h-full w-full object-cover"
  //       />
  //     </div>
  //   ),
  // },
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-[var(--color-neutral-900)]">
          {row.original.name}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "_count.products",
    header: "Products",
    cell: ({ row }) => (
      <span className="text-[var(--color-neutral-700)]">
        {row.original._count?.products || 0} Items
      </span>
    ),
  },
  // {
  //   accessorKey: "isActive",
  //   header: "Status",
  //   cell: ({ row }) =>
  //     row.original.isActive ? (
  //       <span className="inline-flex items-center rounded-full bg-[var(--color-success-50)] px-3 py-1 text-xs font-medium text-[var(--color-success-700)]">
  //         Active
  //       </span>
  //     ) : (
  //       <span className="inline-flex items-center rounded-full bg-[var(--color-neutral-100)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)]">
  //         Inactive
  //       </span>
  //     ),
  // },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => (
      <span className="text-[var(--color-neutral-700)]">
        {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
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
          onClick={() => {
            setSelectedBrand(row.original);
            setIsEditOpen(true);
          }}
        >
          <Pencil className="h-4 w-4 text-[var(--color-neutral-500)]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteId(row.original.uuid)}
        >
          <Trash2 className="h-4 w-4 text-[var(--color-error-600)]" />
        </Button>
      </div>
    ),
  },
];

  if (isLoading && !data) {
    return <LoadingState text="Loading brands..." />;
  }
  if (error) return <ErrorState message="Failed to load brands" onRetry={() => refetch()} />;

  console.log("Brands:", brands);
  return (
    <div>
      {/* <AdminBreadcrumb items={[{ label: "Brands" }]} /> */}
      <AdminPageHeader
        title="Brand Management"
        description="Manage product brands and their associated catalogs."
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        }
      />
      
        <AdminContent className="h-[calc(100vh-80px)] overflow-hidden">
  <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] px-6 py-6">

    {/* Search + Filter */}
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-400)]" />
        <input
          type="text"
          placeholder="Search brands..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-11 w-full rounded-xl border border-[var(--color-neutral-300)] bg-white pl-11 pr-4 text-sm text-[var(--color-neutral-900)] outline-none transition-all focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
        />
      </div>

      {/* <div className="flex gap-3">
        <Button
          variant="outline"
          className="rounded-xl border-[var(--color-neutral-300)] bg-white text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]"
        >
          All Status
        </Button>

        <Button
          variant="outline"
          className="rounded-xl border-[var(--color-neutral-300)] bg-white text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div> */}
    </div>

    {/* Table */}
    <div className="mt-6 flex-1 min-h-0 overflow-hidden">
      <DataTable
        columns={columns}
        data={brands}
        pageSize={10}
        className="bg-white"
      />
    </div>
  </div>
</AdminContent>

      <FormModal
  open={isCreateOpen}
  onClose={() => setIsCreateOpen(false)}
  title="Add Brand"
  description="Create a new product brand"
>
  <BrandForm
    isLoading={createMutation.isPending}
    submitLabel="Create Brand"
    onSubmit={async (data) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
      };

      await createMutation.mutateAsync(payload);

      setIsCreateOpen(false);
    }}
  />
</FormModal>  

<FormModal
  open={isEditOpen}
  onClose={() => {
    setIsEditOpen(false);
    setSelectedBrand(null);
  }}
  title="Update Brand"
  description="Update the selected brand"
>
  {selectedBrand && (
    <BrandForm
      initialData={{
        name: selectedBrand.name,
        slug: selectedBrand.slug,
        description: selectedBrand.description,
        
      }}
      isEditing
      isLoading={updateMutation.isPending}
      submitLabel="Update Brand"
      onSubmit={async (data) => {
        const payload = {
          name: data.name,
          slug: data.slug,
          description: data.description || null,
         
        };

        await updateMutation.mutateAsync({
          uuid: selectedBrand.uuid,
          data: payload,
        });

        setIsEditOpen(false);
        setSelectedBrand(null);
        refetch();
      }}
    />
  )}
</FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) 

            deleteMutation.mutate(deleteId, {
              onSuccess: () => setDeleteId(null),
            });
          }
        }
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
