"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { useInventoryTransactions } from "@/features/inventory/hooks";
import { formatDate } from "@/lib/utils";
import type { InventoryTransactionItem } from "@/features/inventory/types";

const typeBadgeColors: Record<string, string> = {
  PURCHASE: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  SALE: "bg-green-100 text-green-800 hover:bg-green-200",
  RETURN: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  ADJUSTMENT: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  DAMAGE: "bg-red-100 text-red-800 hover:bg-red-200",
  TRANSFER: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

const columns: ColumnDef<InventoryTransactionItem>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => row.original.productName ?? "—",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge className={typeBadgeColors[row.original.type] ?? ""}>
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => row.original.notes ?? "—",
  },
  {
    accessorKey: "referenceType",
    header: "Reference",
    cell: ({ row }) => row.original.referenceType ?? "—",
  },
];

export default function InventoryHistoryPage() {
  const [inventoryId, setInventoryId] = useState("");
  const [params, setParams] = useState<{
    page?: number;
    limit?: number;
    type?: string;
  }>({ page: 1, limit: 20 });

  const { data, isLoading, error } = useInventoryTransactions(
    inventoryId,
    params
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const transactionData = data?.data?.data ?? [];

  return (
    <div>
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Inventory" },
          { label: "History" },
        ]}
      />
      <AdminPageHeader
        title="Inventory History"
        description="View all inventory transactions"
      />
      <AdminContent>
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">Inventory ID</label>
          <input
            type="text"
            className="w-full max-w-md border rounded-md p-2"
            placeholder="Enter inventory ID"
            value={inventoryId}
            onChange={(e) => setInventoryId(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Filter by type:</label>
          <select
            className="border rounded-md p-2"
            value={params.type ?? ""}
            onChange={(e) =>
              setParams((prev) => ({
                ...prev,
                type: e.target.value || undefined,
              }))
            }
          >
            <option value="">All</option>
            <option value="PURCHASE">Purchase</option>
            <option value="SALE">Sale</option>
            <option value="RETURN">Return</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="DAMAGE">Damage</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>
        <DataTable
          columns={columns}
          data={transactionData}
        />
      </AdminContent>
    </div>
  );
}
