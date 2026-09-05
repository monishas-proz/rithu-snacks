"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Filter } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { OrderDetailResponse } from "@/features/orders/types";
import { useCustomerOrders, useCancelCustomerOrder } from "../../hooks/use-customer-orders";
import { useAddToCartMutation } from "../../hooks/use-customer-cart";
import { CustomDropdown, type DropdownOption } from "./CustomDropdown";

const STATUS_OPTIONS: DropdownOption[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

interface OrdersTabProps {
  orders?: OrderDetailResponse[];
  isLoading?: boolean;
  error?: Error | null;
  onRefetch?: () => void;
}

export function OrdersTab({
  orders: initialOrders = [],
  isLoading: initialLoading,
  error: initialError,
  onRefetch,
}: OrdersTabProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [trackingOrder, setTrackingOrder] = useState<OrderDetailResponse | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderSuccessId, setReorderSuccessId] = useState<string | null>(null);

  const cancelMutation = useCancelCustomerOrder();
  const addToCartMutation = useAddToCartMutation();

  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    error: ordersQueryError,
    refetch: refetchQuery,
  } = useCustomerOrders({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(selectedStatus !== "all" ? { status: selectedStatus } : {}),
  });

  const orders = ordersResponse?.data ?? initialOrders;
  const isLoading = isOrdersLoading || (initialLoading && !ordersResponse);
  const error = ordersQueryError || initialError;

  const handleRefetch = () => {
    refetchQuery();
    onRefetch?.();
  };

  const getStatusClasses = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-theme-status-del-bg text-theme-status-del-fg";
      case "cancelled":
        return "bg-theme-status-can-bg text-theme-status-can-fg";
      case "out_for_delivery":
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "packed":
      case "processing":
        return "bg-amber-100 text-amber-800";
      case "pending":
      case "confirmed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-theme-status-out-bg text-theme-status-out-fg";
    }
  };

  // 4 Breakpoint Stepper (Placed -> Packed by Admin, Out for Delivery by Staff, Delivered / Returned / Cancelled)
  const getTrackingStepIndex = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "confirmed":
        return 0;
      case "processing":
      case "packed":
        return 1;
      case "shipped":
      case "out_for_delivery":
        return 2;
      case "delivered":
      case "returned":
      case "cancelled":
        return 3;
      default:
        return 0;
    }
  };

  const handleReorder = async (order: OrderDetailResponse) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(order.id);
    try {
      for (const item of order.items) {
        const variantId = item.variantId || item.productId;
        if (variantId) {
          await addToCartMutation.mutateAsync({
            variantId: String(variantId),
            quantity: item.quantity || 1,
          });
        }
      }
      setReorderSuccessId(order.id);
      setTimeout(() => setReorderSuccessId(null), 4000);
    } catch (err) {
      console.error("Failed to reorder items into cart:", err);
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header with Title and Status Filter Dropdown on the Right */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-theme-text-secondary">
          My Orders {orders.length > 0 && `(${orders.length})`}
        </h2>
        <div className="w-48 sm:w-56">
          <CustomDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={STATUS_OPTIONS}
            placeholder="Filter by Status"
          />
        </div>
      </div>

      {isLoading ? (
        /* Shimmer Loading State */
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-theme-surface border border-theme-border rounded-2xl p-6 animate-pulse space-y-4"
            >
              <div className="h-6 bg-theme-border rounded-md w-1/3" />
              <div className="h-16 bg-theme-border-subtle rounded-md w-full" />
              <div className="h-8 bg-theme-border rounded-md w-1/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 text-center space-y-4">
          <p className="text-sm text-theme-text-muted">Failed to load your orders.</p>
          <button
            type="button"
            onClick={handleRefetch}
            className="bg-theme-primary text-theme-primary-fg px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-12 sm:p-16 text-center shadow-2xs">
          <div className="w-20 h-20 mx-auto mb-6 rotate-45 border-2 border-theme-border-accent rounded-xl bg-theme-surface-alt flex items-center justify-center">
            <span className="-rotate-45 text-theme-primary text-2xl font-bold">🛒</span>
          </div>
          <h3 className="text-lg font-bold uppercase tracking-wide text-theme-text-secondary">
            {selectedStatus !== "all"
              ? `No ${selectedStatus.replace(/_/g, " ")} orders`
              : "No orders yet"}
          </h3>
          <p className="text-xs sm:text-sm text-theme-text-muted max-w-sm mx-auto mt-3 mb-6 leading-relaxed">
            {selectedStatus !== "all"
              ? `You don't have any orders currently marked as "${selectedStatus.replace(/_/g, " ")}".`
              : "Your murukku is waiting. Browse our handcrafted festive snacks and your orders will show up here."}
          </p>
          {selectedStatus !== "all" ? (
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3.5 px-7 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              View All Orders
            </button>
          ) : (
            <Link href="/products">
              <button
                type="button"
                className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3.5 px-7 rounded-lg transition-colors cursor-pointer min-h-[44px]"
              >
                Start Shopping
              </button>
            </Link>
          )}
        </div>
      ) : (
        /* Orders List */
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const isOngoing = order.status !== "delivered" && order.status !== "cancelled";
            const isReordering = reorderingId === order.id;
            const isReordered = reorderSuccessId === order.id;

            return (
              <div
                key={order.id}
                className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs"
              >
                {/* Card Header Bar */}
                <div className="flex justify-between items-center gap-4 flex-wrap p-4 sm:p-5 bg-theme-surface-alt border-b border-theme-border-subtle">
                  <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-theme-text-muted">
                        Order
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-theme-text-primary mt-1">
                        {order.orderNumber || `#${order.id}`}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-theme-text-muted">
                        Placed
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-theme-text-primary mt-1">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-theme-text-muted">
                        Total
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-theme-text-primary mt-1">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full ${getStatusClasses(
                      order.status
                    )}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Ordered Items List */}
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3.5 py-1">
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-[repeating-linear-gradient(45deg,#F6ECDC,#F6ECDC_6px,#EFE2CD_6px,#EFE2CD_12px)] flex items-center justify-center">
                          <span className="text-[9px] font-mono text-theme-text-muted uppercase">
                            {it.productName ? it.productName.slice(0, 6) : "SNACK"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-theme-text-primary truncate">
                            {it.productName || "Snack Item"}
                          </div>
                          <div className="text-xs text-theme-text-muted mt-0.5">
                            {it.quantity ? `Qty: ${it.quantity}` : ""} {it.variantName ? `· ${it.variantName}` : ""}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-theme-primary">
                          {formatPrice(it.totalPrice ?? it.unitPrice ?? 0)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-theme-text-muted py-2">
                      Order details available in invoice.
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="px-4 sm:px-5 pb-5 pt-1 flex items-center gap-2.5 flex-wrap">
                  {isOngoing ? (
                    <button
                      type="button"
                      onClick={() => setTrackingOrder(order)}
                      className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors cursor-pointer min-h-[40px]"
                    >
                      Track Order
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isReordering}
                      onClick={() => handleReorder(order)}
                      className={`text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors cursor-pointer min-h-[40px] ${
                        isReordered
                          ? "bg-green-600 text-white"
                          : "bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg"
                      } disabled:opacity-50`}
                    >
                      {isReordering ? (
                        "Adding to Cart..."
                      ) : isReordered ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Added to Cart
                        </span>
                      ) : (
                        "Reorder"
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="border border-theme-border hover:bg-theme-surface-alt text-theme-text-subtle text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors cursor-pointer min-h-[40px]"
                  >
                    Invoice
                  </button>

                  <Link href="/contact">
                    <button
                      type="button"
                      className="border border-theme-border hover:bg-theme-surface-alt text-theme-text-subtle text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors cursor-pointer min-h-[40px]"
                    >
                      Need Help
                    </button>
                  </Link>

                  {order.status === "pending" && (
                    <button
                      type="button"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        if (window.confirm("Are you sure you want to cancel this order?")) {
                          cancelMutation.mutate({
                            uuid: order.id,
                            payload: { note: "Cancelled by customer" },
                          });
                        }
                      }}
                      className="border border-red-300 hover:bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors cursor-pointer min-h-[40px] disabled:opacity-50 ml-auto"
                    >
                      {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Interactive Order Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-theme-surface border border-theme-border rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-theme-border-subtle pb-4">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-theme-text-muted">
                  Live Shipment Tracking
                </div>
                <h3 className="text-lg font-bold text-theme-text-primary mt-0.5">
                  Order {trackingOrder.orderNumber || `#${trackingOrder.id}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="w-8 h-8 rounded-full border border-theme-border flex items-center justify-center text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-alt transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Visual (4 Breakpoints: Placed -> Packed -> Out for Delivery -> Delivered / Returned / Cancelled) */}
            {(() => {
              const isDelivered = trackingOrder.status?.toLowerCase() === "delivered";
              const isReturned = trackingOrder.status?.toLowerCase() === "returned";
              const isCancelled = trackingOrder.status?.toLowerCase() === "cancelled";

              const finalStepLabel = isReturned
                ? "Returned"
                : isCancelled
                ? "Cancelled"
                : "Delivered";

              const finalStepStage = isReturned
                ? "Store"
                : isCancelled
                ? "Order"
                : "Staff";

              const finalStepDesc = isDelivered
                ? "Delivered successfully"
                : isReturned
                ? "Returned & Refunded"
                : isCancelled
                ? "Order Cancelled"
                : "Expected soon";

              const modalSteps = [
                {
                  label: "Placed",
                  stage: "Admin",
                  desc: trackingOrder.createdAt ? new Date(trackingOrder.createdAt).toLocaleDateString() : "Received",
                },
                {
                  label: "Packed",
                  stage: "Admin",
                  desc:
                    getTrackingStepIndex(trackingOrder.status) >= 1
                      ? trackingOrder.status === "packed"
                        ? "Packed & Ready"
                        : "Processing"
                      : "Pending",
                },
                {
                  label: "Out for delivery",
                  stage: "Staff",
                  desc:
                    getTrackingStepIndex(trackingOrder.status) >= 2
                      ? trackingOrder.status === "out_for_delivery"
                        ? "Staff on Route"
                        : "Dispatched"
                      : "Pending",
                },
                {
                  label: finalStepLabel,
                  stage: finalStepStage,
                  desc: finalStepDesc,
                  isCancel: isCancelled,
                  isReturn: isReturned,
                },
              ];

              const currentStep = getTrackingStepIndex(trackingOrder.status);

              return (
                <div className="bg-theme-surface-alt rounded-xl p-4 sm:p-5 border border-theme-border-subtle">
                  <div className="grid grid-cols-4 gap-0 items-start">
                    {modalSteps.map((step, idx) => {
                      const isDone = idx <= currentStep;
                      const isActive = idx === currentStep;
                      const isLast = idx === modalSteps.length - 1;

                      const dotBg =
                        isLast && step.isCancel
                          ? "bg-red-500"
                          : isLast && step.isReturn
                          ? "bg-purple-600"
                          : isDone
                          ? "bg-theme-status-del-fg"
                          : isActive
                          ? "bg-theme-secondary"
                          : "bg-theme-border";

                      return (
                        <div key={step.label} className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
                          <div className="flex items-center">
                            <span
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex-shrink-0 transition-colors ${dotBg}`}
                            />
                            {!isLast && (
                              <span
                                className={`h-0.5 flex-1 transition-colors ${
                                  idx < currentStep ? "bg-theme-status-del-fg" : "bg-theme-border"
                                }`}
                              />
                            )}
                          </div>
                          {/* <div className="text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold text-theme-text-muted">
                            {step.stage}
                          </div> */}
                          <div
                            className={`text-[11px] sm:text-xs font-semibold leading-tight pr-0.5 truncate ${
                              isDone || isActive ? "text-theme-text-primary" : "text-theme-text-muted"
                            }`}
                            title={step.label}
                          >
                            {step.label}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-theme-text-muted pr-0.5 line-clamp-2">
                            {step.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Delivery Address Snapshot */}
            {trackingOrder.shippingAddress && (
              <div className="space-y-1.5 text-xs bg-theme-surface-warm p-4 rounded-xl border border-theme-border-subtle">
                <div className="font-semibold text-theme-text-primary uppercase tracking-wider text-[11px]">
                  Delivery Address
                </div>
                <div className="text-theme-text-primary font-medium">
                  {trackingOrder.shippingAddress.fullName || trackingOrder.shippingAddress.addressLine1}
                </div>
                <div className="text-theme-text-muted">
                  {[
                    trackingOrder.shippingAddress.addressLine1,
                    trackingOrder.shippingAddress.addressLine2,
                    trackingOrder.shippingAddress.city,
                    trackingOrder.shippingAddress.state,
                    trackingOrder.shippingAddress.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            )}

            {/* Items Summary in Modal */}
            <div className="space-y-2">
              <div className="font-semibold text-xs text-theme-text-muted uppercase tracking-wider">
                Order Items ({trackingOrder.items?.length || 0})
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {trackingOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-theme-border-subtle last:border-0">
                    <span className="text-theme-text-primary font-medium truncate max-w-[240px]">
                      {it.productName} {it.variantName ? `(${it.variantName})` : ""} × {it.quantity}
                    </span>
                    <span className="font-semibold text-theme-primary">
                      {formatPrice(it.totalPrice ?? it.unitPrice ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-6 rounded-lg transition-colors cursor-pointer min-h-[40px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
