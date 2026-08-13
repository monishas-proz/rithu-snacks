"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/features/brands/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModal } from "@/components/common/FormModal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import { createBrandSchema, type CreateBrandSchemaInput } from "@/features/brands/validations/brand.schema";
import type { ColumnDef } from "@tanstack/react-table";
import type { BrandListItem } from "@/features/brands/types";

export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandListItem | null>(null);

  const { data, isLoading, error, refetch } = useBrands({
    search: search || undefined,
  });

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const brands = data?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateBrandSchemaInput>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo: "",
      isActive: true,
    },
  });

  const watchName = watch("name");

  useEffect(() => {
    if (!editingBrand) {
      setValue("slug", slugify(watchName || ""));
    }
  }, [watchName, editingBrand, setValue]);

  useEffect(() => {
    if (editingBrand) {
      reset({
        name: editingBrand.name,
        slug: editingBrand.slug,
        description: editingBrand.description ?? "",
        logo: editingBrand.logo ?? "",
        isActive: editingBrand.isActive,
      });
    } else {
      reset({ name: "", slug: "", description: "", logo: "", isActive: true });
    }
  }, [editingBrand, reset]);

  const onSubmit = (formData: CreateBrandSchemaInput) => {
    if (editingBrand) {
      updateMutation.mutate(
        { id: editingBrand.id, data: formData },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingBrand(null);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setModalOpen(false);
          reset();
        },
      });
    }
  };

  const handleOpenModal = (brand?: BrandListItem) => {
    if (brand) {
      setEditingBrand(brand);
    } else {
      setEditingBrand(null);
    }
    setModalOpen(true);
  };

  const columns: ColumnDef<BrandListItem, unknown>[] = [
    {
      accessorKey: "name",
      header: "Brand",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: "_count.products",
      header: "Products",
      cell: ({ row }) => row.original._count?.products || 0,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenModal(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-error-600" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingState text="Loading brands..." />;
  if (error) return <ErrorState message="Failed to load brands" onRetry={() => refetch()} />;

  return (
    <div>
      <AdminBreadcrumb items={[{ label: "Brands" }]} />
      <AdminPageHeader
        title="Brands"
        description="Manage your product brands"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        }
      />
      <AdminContent>
        <DataTable
          columns={columns}
          data={brands}
          searchKey="name"
          searchPlaceholder="Search brands..."
          pageSize={20}
        />
      </AdminContent>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBrand(null);
        }}
        title={editingBrand ? "Edit Brand" : "Add Brand"}
        description={editingBrand ? "Update brand details" : "Create a new brand"}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingBrand(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingBrand ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-error-600">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Brand name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              {...register("slug")}
              readOnly={!editingBrand}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="auto-generated-from-name"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-error-600">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Brand description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              {...register("logo")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="https://example.com/logo.png"
            />
            {errors.logo && (
              <p className="mt-1 text-sm text-error-600">{errors.logo.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isActive")}
              id="isActive"
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
        </form>
      </FormModal>

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
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
