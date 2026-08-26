"use client";

import * as React from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import type {
  AdminCustomerOrderItemDto,
  AdminCustomerListPaginationMeta,
} from "../../types/admin-customer.types";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

interface CustomerOrdersSectionProps {
  orders?: AdminCustomerOrderItemDto[];
  meta?: AdminCustomerListPaginationMeta;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onPageChange?: (page: number) => void;
}

export function CustomerOrdersSection({
  orders = [],
  meta,
  isLoading = false,
  error = null,
  onRetry,
  onPageChange,
}: CustomerOrdersSectionProps) {
  if (isLoading) {
    return <LoadingState text="Loading customer order history..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || "Failed to load customer order history"}
        onRetry={onRetry}
      />
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-neutral-900">
          No Orders Placed Yet
        </h3>
        <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
          This customer has not completed any orders in the store yet.
        </p>
      </div>
    );
  }

  const getOrderStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "";
    if (s === "DELIVERED") {
      return (
        <span className="inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF7EE] text-[#1E833F]">
          Delivered
        </span>
      );
    }
    if (s === "RETURNED") {
      return (
        <span className="inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF7E7] text-[#9A6900]">
          Returned
        </span>
      );
    }
    if (s === "CANCELLED") {
      return (
        <span className="inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-xs font-medium bg-[#FDE8E8] text-[#9B1C1C]">
          Cancelled
        </span>
      );
    }
    if (s === "SHIPPED") {
      return (
        <span className="inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-xs font-medium bg-[#EBF3FF] text-[#1D63D6]">
          Shipped
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-3.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 capitalize">
        {status ? status.toLowerCase() : "Processing"}
      </span>
    );
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#F2EFE9]">
              <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Order ID
              </th>
              <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Date
              </th>
              <th className="py-4 px-6 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Status
              </th>
              <th className="py-4 px-6 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE9]">
            {orders.map((order) => {
              const formattedOrderNumber = order.orderNumber?.startsWith("#")
                ? order.orderNumber
                : `#${order.orderNumber}`;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-neutral-50/60 transition-colors"
                >
                  {/* Order ID */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-semibold text-neutral-900 font-mono text-sm">
                      {formattedOrderNumber}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-neutral-600">
                    {formatDate(order.placedAt || order.createdAt)}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    {getOrderStatusBadge(order.status)}
                  </td>

                  {/* Total */}
                  <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-semibold text-neutral-900 font-mono">
                    {formatAmount(order.totalAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: View All Orders Link matching screenshot */}
      <div className="py-5 text-center border-t border-[#F2EFE9]">
        <Link
          href="/admin/dashboard/orders"
          className="inline-block text-xs font-semibold uppercase tracking-wider text-[#801B2B] hover:underline"
        >
          View All Orders
        </Link>
      </div>

      {/* Pagination Footer (if multi-page) */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#F2EFE9] px-6 py-3 bg-neutral-50/50">
          <p className="text-xs text-neutral-500">
            Page <span className="font-medium text-neutral-900">{meta.page}</span> of{" "}
            <span className="font-medium text-neutral-900">{meta.totalPages}</span> ({meta.total} orders)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange?.(meta.page - 1)}
              className="h-8 text-xs px-3 rounded-lg border-[#EDE8E1] hover:bg-neutral-100"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange?.(meta.page + 1)}
              className="h-8 text-xs px-3 rounded-lg border-[#EDE8E1] hover:bg-neutral-100"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
