"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCategories, useDeleteCategory } from "@/features/categories/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { CategoryListItem } from "@/features/categories/types";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useCategories({
    search: search || undefined,
  });

  const deleteMutation = useDeleteCategory();

  const categories = data?.success && data.data ? data.data : [];

  const columns: ColumnDef<CategoryListItem, unknown>[] = [
    {
      accessorKey: "name",
      header: "Category",
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
      accessorKey: "_count.children",
      header: "Subcategories",
      cell: ({ row }) => row.original._count?.children || 0,
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
            onClick={() => router.push(`/categories/${row.original.slug}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/dashboard/categories/${row.original.id}/edit`)}
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

  if (isLoading) return <LoadingState text="Loading categories..." />;
  if (error) return <ErrorState message="Failed to load categories" onRetry={() => refetch()} />;

  return (
    <div>
      <AdminBreadcrumb items={[{ label: "Categories" }]} />
      <AdminPageHeader
        title="Categories"
        description="Manage your product categories"
        actions={
          <Button onClick={() => router.push("/admin/dashboard/categories/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        }
      />
      <AdminContent>
        <DataTable
          columns={columns}
          data={categories}
          searchKey="name"
          searchPlaceholder="Search categories..."
          pageSize={20}
        />
      </AdminContent>

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
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
