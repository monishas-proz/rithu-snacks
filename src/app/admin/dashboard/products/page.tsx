"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProducts, useDeleteProduct } from "@/features/products/hooks";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { ProductListItem } from "@/features/products/types";

export default function AdminProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useProducts({
    page,
    limit: 20,
    search: search || undefined,
  });

  const deleteMutation = useDeleteProduct();

  const products = data?.success && data.data ? data.data : [];
  const meta = data?.meta;

  const columns: ColumnDef<ProductListItem, unknown>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0] && (
            <img
              src={row.original.images[0].url}
              alt={row.original.name}
              className="h-10 w-10 rounded-md object-cover"
            />
          )}
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name || "-",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatPrice(Number(row.original.price)),
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
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) =>
        row.original.isFeatured ? (
          <Badge variant="info">Featured</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
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
            onClick={() => router.push(`/products/${row.original.slug}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/dashboard/products/${row.original.id}/edit`)}
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

  if (isLoading) return <LoadingState text="Loading products..." />;
  if (error) return <ErrorState message="Failed to load products" onRetry={() => refetch()} />;

  return (
    <div>
      <AdminBreadcrumb items={[{ label: "Products" }]} />
      <AdminPageHeader
        title="Products"
        description="Manage your product catalog"
        actions={
          <Button onClick={() => router.push("/admin/dashboard/products/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />
      <AdminContent>
        <DataTable
          columns={columns}
          data={products}
          searchKey="name"
          searchPlaceholder="Search products..."
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
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
