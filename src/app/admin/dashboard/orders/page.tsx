"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
} from "@tanstack/react-table";
import {
  Search,
  Eye,
  XCircle,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormModal } from "@/components/common/FormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime, formatPrice } from "@/lib/utils";
import {
  useAdminOrders,
  useAdminOrder,
  useUpdateOrderStatus,
  useCancelOrderAdmin,
} from "@/features/orders/hooks";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ORDER_STATUS_LABELS,
} from "@/features/orders/components/OrderStatusBadge";
import { ORDER_STATUSES, type OrderListItem, type OrderStatus } from "@/features/orders/types";
import { SearchInput } from "@/components/ui/search-input";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useAdminOrders({
    page,
    limit: 20,
    search: search || undefined,
    status: (statusFilter || undefined) as OrderStatus | undefined,
  });

  const { data: orderDetail, isLoading: detailLoading } =
    useAdminOrder(viewOrderId);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrderAdmin();

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const [draftStatus, setDraftStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (orderDetail) {
      setDraftStatus(orderDetail.status);
    }
  }, [orderDetail]);

  const changeStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleUpdateStatus = () => {
    if (viewOrderId && draftStatus && orderDetail && draftStatus !== orderDetail.status) {
      updateStatus.mutate(
        { id: viewOrderId, status: draftStatus },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const orderLocked =
    !!orderDetail &&
    ["CANCELLED", "REFUNDED", "RETURNED"].includes(orderDetail.status);

  const columns: ColumnDef<OrderListItem, unknown>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "user.name",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.user?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.user?.email ?? ""}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "totalItems",
      header: "Items",
      cell: ({ row }) => row.original.totalItems,
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatPrice(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "payment.status",
      header: "Payment",
      cell: ({ row }) =>
        row.original.payment ? (
          <div className="flex flex-col gap-1">
            <PaymentStatusBadge status={row.original.payment.status} />
            <span className="text-xs text-muted-foreground">
              {row.original.payment.method.replace(/_/g, " ")}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
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
            onClick={() => setViewOrderId(row.original.id)}
            aria-label="View order"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-error-600"
            onClick={() => setCancelOrderId(row.original.id)}
            aria-label="Cancel order"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumb
        items={[{ label: "Sales" }, { label: "Orders" }]}
      />
      <AdminPageHeader
        title="Orders"
        description="View, manage and fulfill customer orders"
      />

      <AdminContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Search by order number, customer, product..."
            defaultValue={search}
            onSearch={(val) => {
              setSearch(val.trim());
              setPage(1);
            }}
            className="max-w-sm flex-1"
          />
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => changeStatusFilter(e.target.value)}
              placeholder="All statuses"
              options={Object.entries(ORDER_STATUS_LABELS).map(
                ([value, label]) => ({ value, label })
              )}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState text="Loading orders..." />
        ) : error ? (
          <ErrorState
            message="Failed to load orders. Please try again."
            onRetry={refetch}
          />
        ) : (
          <>
            <DataTable columns={columns} data={orders} pageSize={20} />

            {meta && meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {meta.totalPages} ({meta.total} orders)
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page >= meta.totalPages}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </AdminContent>

      <FormModal
        open={!!viewOrderId}
        onClose={() => setViewOrderId(null)}
        title={orderDetail ? `Order ${orderDetail.orderNumber}` : "Order Details"}
        description="Manage order status and fulfillment"
        size="xl"
        footer={
          <Button variant="outline" onClick={() => setViewOrderId(null)}>
            Close
          </Button>
        }
      >
        {detailLoading || !orderDetail ? (
          <LoadingState text="Loading order details..." />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex-1 min-w-48">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Update Status
                </label>
                <Select
                  value={draftStatus ?? orderDetail.status}
                  onChange={(e) =>
                    setDraftStatus(e.target.value as OrderStatus)
                  }
                  options={ORDER_STATUSES.map((s) => ({
                    value: s,
                    label: ORDER_STATUS_LABELS[s],
                  }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleUpdateStatus}
                  disabled={
                    orderLocked ||
                    updateStatus.isPending ||
                    draftStatus === orderDetail.status
                  }
                >
                  {updateStatus.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
                <Button
                  variant="outline"
                  className="text-error-600"
                  onClick={() => setCancelOrderId(orderDetail.id)}
                  disabled={orderLocked}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
              {orderLocked && (
                <p className="w-full text-xs text-muted-foreground">
                  This order is {orderDetail.status.toLowerCase()} and can no
                  longer be modified.
                </p>
              )}
            </div>

            <OrderDetailView order={orderDetail} />
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={!!cancelOrderId}
        onClose={() => setCancelOrderId(null)}
        onConfirm={() => {
          if (cancelOrderId) {
            cancelOrder.mutate(
              { id: cancelOrderId },
              {
                onSuccess: () => {
                  setCancelOrderId(null);
                  refetch();
                },
              }
            );
          }
        }}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? Stock will be returned to inventory."
        confirmText="Cancel Order"
        variant="destructive"
        isLoading={cancelOrder.isPending}
      />
    </div>
  );
}
