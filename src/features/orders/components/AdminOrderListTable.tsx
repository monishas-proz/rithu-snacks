"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  XCircle,
  Printer,
  CheckCircle,
  PackageCheck,
  PlayCircle,
  Loader2,
  ArrowRight,
  Truck,
} from "lucide-react";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/common/FormModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { AssignStaffModal } from "@/features/orders/components/AssignStaffModal";
import {
  useAdminOrders,
  useAdminOrder,
  useConfirmAdminOrder,
  useProcessAdminOrder,
  usePackAdminOrder,
  useCancelOrderAdmin,
} from "@/features/orders/hooks";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  PAYMENT_STATUS_LABELS,
} from "@/features/orders/components/OrderStatusBadge";
import {
  PAYMENT_STATUSES,
  type OrderListItemResponse,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/orders/types";

interface AdminOrderListTableProps {
  status?: OrderStatus;
  emptyMessage?: string;
}

export function AdminOrderListTable({
  status,
  emptyMessage = "No orders found matching your criteria.",
}: AdminOrderListTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [assignStaffOrder, setAssignStaffOrder] = useState<{
    id: string;
    orderNumber: string;
  } | null>(null);

  const { data, isLoading, error, refetch } = useAdminOrders({
    page,
    pageSize,
    search: search || undefined,
    status: status || undefined,
    paymentStatus: (paymentFilter || undefined) as PaymentStatus | undefined,
  });

  const { data: orderDetail, isLoading: detailLoading } =
    useAdminOrder(viewOrderId);

  const confirmOrder = useConfirmAdminOrder();
  const processOrder = useProcessAdminOrder();
  const packOrder = usePackAdminOrder();
  const cancelOrder = useCancelOrderAdmin();

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const isTransitionPending =
    confirmOrder.isPending ||
    processOrder.isPending ||
    packOrder.isPending ||
    cancelOrder.isPending;

  const currentDetailStatus = orderDetail?.status?.toLowerCase();
  const isOrderLocked =
    !!orderDetail &&
    ["cancelled", "returned", "delivered"].includes(currentDetailStatus || "");

  const columns: ColumnDef<OrderListItemResponse, unknown>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="leading-snug">
          <button
            type="button"
            onClick={() => setViewOrderId(row.original.id)}
            className="text-left font-semibold text-[#211C1A] hover:text-[#7A2224] transition-colors cursor-pointer"
          >
            {row.original.orderNumber}
          </button>
          <div className="text-[11px] text-[#A2968C]">
            {formatDateTime(row.original.placedAt || row.original.createdAt)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <div className="leading-snug max-w-[200px] truncate">
            <div className="font-semibold text-[#211C1A] truncate">
              {customer?.name || "Customer"}
            </div>
            <div className="text-[11px] text-[#A2968C] font-mono truncate">
              {customer?.phone ||
                customer?.email ||
                (customer?.customerId ? `ID: ${customer.customerId}` : "—")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "totalItems",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-[#4A423D]">
          {row.original.totalItems}{" "}
          {row.original.totalItems === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-[#211C1A] tabular-nums text-sm">
          {formatPrice(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <div className="space-y-1">
          <PaymentStatusBadge status={row.original.paymentStatus} />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "placedAt",
      header: "Placed At",
      cell: ({ row }) => (
        <div className="leading-snug text-xs text-[#4A423D]">
          <div>
            {new Date(
              row.original.placedAt || row.original.createdAt
            ).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-[11px] text-[#A2968C]">
            {new Date(
              row.original.placedAt || row.original.createdAt
            ).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const orderStatus = (row.original.status || "").toLowerCase();
        const isCancellable = !["cancelled", "delivered", "returned"].includes(
          orderStatus
        );

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Quick advance action button */}
            {orderStatus === "pending" && (
              <button
                type="button"
                onClick={() =>
                  confirmOrder.mutate(
                    { id: row.original.id, note: "Confirmed by admin" },
                    { onSuccess: () => refetch() }
                  )
                }
                title="Confirm Order"
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#E3C8C4] bg-[#FBF3F2] text-xs font-semibold text-[#7A2224] hover:brightness-95 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {orderStatus === "confirmed" && (
              <button
                type="button"
                onClick={() =>
                  processOrder.mutate(
                    { id: row.original.id, note: "Processing started" },
                    { onSuccess: () => refetch() }
                  )
                }
                title="Start Processing"
                className="grid h-8 w-8 place-items-center rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:brightness-95 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <PlayCircle className="h-3.5 w-3.5" />
              </button>
            )}

            {orderStatus === "processing" && (
              <button
                type="button"
                onClick={() =>
                  packOrder.mutate(
                    { id: row.original.id, note: "Marked as packed" },
                    { onSuccess: () => refetch() }
                  )
                }
                title="Mark as Packed"
                className="grid h-8 w-8 place-items-center rounded-lg border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:brightness-95 transition-all cursor-pointer"
                disabled={isTransitionPending}
              >
                <PackageCheck className="h-3.5 w-3.5" />
              </button>
            )}

            {orderStatus === "packed" && (
              <button
                type="button"
                onClick={() =>
                  setAssignStaffOrder({
                    id: row.original.id,
                    orderNumber: row.original.orderNumber,
                  })
                }
                title="Assign Delivery Staff"
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#7A2224] bg-[#7A2224] text-xs font-semibold text-white hover:bg-[#5A1A11] transition-all cursor-pointer shadow-xs"
                disabled={isTransitionPending}
              >
                <Truck className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewOrderId(row.original.id)}
              title="View Order Details"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#EBE1D6] bg-white text-xs text-[#6B615A] hover:bg-[#F7F2EC] hover:text-[#40100F] hover:border-[#D8CBBC] transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {isCancellable && (
              <button
                type="button"
                onClick={() => setCancelOrderId(row.original.id)}
                title="Cancel Order"
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#F0DCD9] bg-white text-xs text-error-600 hover:bg-error-50 hover:border-error-200 transition-colors cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-background)] rounded-2xl">
      {/* Filter and Search Bar */}
      <div className="flex-shrink-0 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <SearchInput
            placeholder="Search by order number, customer name, email, phone..."
            defaultValue={search}
            onSearch={(val) => {
              setSearch(val.trim());
              setPage(1);
            }}
            className="w-full max-w-md bg-[#FCFAF7] border-[#EBE1D6]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by payment status"
            className="h-10 rounded-xl border border-[#EBE1D6] bg-white px-3 text-xs font-semibold text-[#4A423D] hover:border-[#D8CBBC] focus:border-[#7A2224] focus:outline-hidden cursor-pointer"
          >
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map((ps) => (
              <option key={ps} value={ps}>
                {PAYMENT_STATUS_LABELS[ps] || ps}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table & Pagination Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <LoadingState text="Loading orders..." />
        ) : error ? (
          <ErrorState
            message="Failed to load orders. Please try again."
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 30, 50]}
            page={meta?.page ?? page}
            totalPages={
              meta?.totalPages ??
              Math.max(1, Math.ceil((meta?.total ?? orders.length) / pageSize))
            }
            totalItems={meta?.total ?? orders.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            className="bg-white border border-[#EDE4D9]"
            emptyMessage={emptyMessage}
          />
        )}
      </div>

      {/* Order Detail Modal */}
      <FormModal
        open={!!viewOrderId}
        onClose={() => setViewOrderId(null)}
        title={
          orderDetail ? `Order ${orderDetail.orderNumber}` : "Order Details"
        }
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
            {/* Status Workflow Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mr-1">
                  Current Status:
                </span>
                <OrderStatusBadge status={orderDetail.status} />
                {orderDetail.paymentStatus && (
                  <PaymentStatusBadge status={orderDetail.paymentStatus} />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentDetailStatus === "pending" && (
                  <Button
                    size="sm"
                    className="bg-[#7A2224] hover:bg-[#5A1A11] text-white"
                    onClick={() => {
                      confirmOrder.mutate(
                        { id: orderDetail.id, note: "Order confirmed by admin" },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isTransitionPending}
                  >
                    {confirmOrder.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                    )}
                    Confirm Order
                  </Button>
                )}

                {currentDetailStatus === "confirmed" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      processOrder.mutate(
                        {
                          id: orderDetail.id,
                          note: "Order processing started by admin",
                        },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isTransitionPending}
                  >
                    {processOrder.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-1.5 h-4 w-4" />
                    )}
                    Start Processing
                  </Button>
                )}

                {currentDetailStatus === "processing" && (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      packOrder.mutate(
                        { id: orderDetail.id, note: "Order marked as packed" },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isTransitionPending}
                  >
                    {packOrder.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <PackageCheck className="mr-1.5 h-4 w-4" />
                    )}
                    Mark as Packed
                  </Button>
                )}

                {currentDetailStatus === "packed" && (
                  <Button
                    size="sm"
                    className="bg-[#7A2224] hover:bg-[#5A1A11] text-white"
                    onClick={() => {
                      setAssignStaffOrder({
                        id: orderDetail.id,
                        orderNumber: orderDetail.orderNumber,
                      });
                    }}
                    disabled={isTransitionPending}
                  >
                    <Truck className="mr-1.5 h-4 w-4" />
                    Assign Delivery Staff
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print Invoice
                </Button>

                {!isOrderLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-error-600 border-error-200 hover:bg-error-50"
                    onClick={() => setCancelOrderId(orderDetail.id)}
                    disabled={isTransitionPending}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
              </div>

              {isOrderLocked && (
                <p className="w-full text-xs text-muted-foreground italic pt-1">
                  This order is {orderDetail.status.toLowerCase()} and can no
                  longer be modified.
                </p>
              )}
            </div>

            <OrderDetailView order={orderDetail} />
          </div>
        )}
      </FormModal>

      {/* Assign Staff Modal */}
      <AssignStaffModal
        open={!!assignStaffOrder}
        onClose={() => setAssignStaffOrder(null)}
        orderId={assignStaffOrder?.id ?? null}
        orderNumber={assignStaffOrder?.orderNumber}
        onSuccess={() => {
          refetch();
          if (viewOrderId) {
            // refetch current detail if open
          }
        }}
      />

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        open={!!cancelOrderId}
        onClose={() => setCancelOrderId(null)}
        onConfirm={() => {
          if (cancelOrderId) {
            cancelOrder.mutate(
              { id: cancelOrderId, note: "Cancelled by administrator" },
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
        description="Are you sure you want to cancel this order? This action will mark the order as cancelled in the database."
        confirmText="Cancel Order"
        variant="destructive"
        isLoading={cancelOrder.isPending}
      />
    </div>
  );
}
