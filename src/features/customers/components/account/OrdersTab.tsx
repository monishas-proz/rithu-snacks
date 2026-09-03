"use client";

import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { OrderListItem } from "@/features/orders/types";

interface OrdersTabProps {
  orders?: OrderListItem[];
  isLoading?: boolean;
  error?: Error | null;
  onRefetch?: () => void;
}

export function OrdersTab({
  orders = [],
  isLoading,
  error,
  onRefetch,
}: OrdersTabProps) {
  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm text-theme-text-muted">Failed to load your orders.</p>
        <button
          type="button"
          onClick={onRefetch}
          className="bg-theme-primary text-theme-primary-fg px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    );
  }

  const getStatusClasses = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-theme-status-del-bg text-theme-status-del-fg";
      case "cancelled":
        return "bg-theme-status-can-bg text-theme-status-can-fg";
      case "out_for_delivery":
      case "shipped":
        return "bg-theme-status-out-bg text-theme-status-out-fg";
      default:
        return "bg-theme-status-out-bg text-theme-status-out-fg";
    }
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-theme-text-secondary">
          My Orders {orders.length > 0 && `(${orders.length})`}
        </h2>
      </div>

      {orders.length === 0 ? (
        /* Empty State */
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-12 sm:p-16 text-center shadow-2xs">
          <div className="w-20 h-20 mx-auto mb-6 rotate-45 border-2 border-theme-border-accent rounded-xl bg-theme-surface-alt flex items-center justify-center">
            <span className="-rotate-45 text-theme-primary text-2xl font-bold">🛒</span>
          </div>
          <h3 className="text-lg font-bold uppercase tracking-wide text-theme-text-secondary">
            No orders yet
          </h3>
          <p className="text-xs sm:text-sm text-theme-text-muted max-w-sm mx-auto mt-3 mb-6 leading-relaxed">
            Your murukku is waiting. Browse our handcrafted festive snacks and your orders will show up here.
          </p>
          <Link href="/products">
            <button
              type="button"
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3.5 px-7 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Start Shopping
            </button>
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const isOngoing = order.status !== "delivered" && order.status !== "cancelled";

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
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-[repeating-linear-gradient(45deg,#F6ECDC,#F6ECDC_6px,#EFE2CD_6px,#EFE2CD_12px)]" />
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
                  <Link href="/products">
                    <button
                      type="button"
                      className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-fg text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors cursor-pointer min-h-[40px]"
                    >
                      {isOngoing ? "Track Order" : "Reorder"}
                    </button>
                  </Link>

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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
