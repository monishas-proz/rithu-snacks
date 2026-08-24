"use client";

import * as React from "react";
import Link from "next/link";
import { Package, ExternalLink, Clock, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MockCustomerOrder } from "../../mocks/customer-profile.mock";

interface CustomerOrdersSectionProps {
  orders: MockCustomerOrder[];
}

export function CustomerOrdersSection({ orders }: CustomerOrdersSectionProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
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
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded-full border border-success-200">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Shipped
          </span>
        );
      case "PROCESSING":
      case "PACKED":
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="h-3 w-3" />
            {status}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
      case "RETURNED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            <RotateCcw className="h-3 w-3" />
            Returned
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            PAID
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            PENDING
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
            FAILED
          </span>
        );
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return (
          <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
            REFUNDED
          </span>
        );
      default:
        return <span className="text-xs text-neutral-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
              Customer Order History
            </h2>
            <p className="text-xs text-neutral-500">
              {orders.length} order{orders.length === 1 ? "" : "s"} placed to date
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                  {/* Order Number */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-neutral-900">
                      {order.orderNumber}
                    </span>
                    <p className="text-[10px] font-mono text-neutral-400">
                      ID: {order.id.slice(0, 8)}...
                    </p>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-neutral-600">
                    {new Date(order.placedAt || order.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </td>

                  {/* Items Summary */}
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-neutral-900 line-clamp-1 max-w-xs sm:max-w-md">
                      {order.itemsSummary}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {order.totalItems} item{order.totalItems === 1 ? "" : "s"} total
                    </p>
                  </td>

                  {/* Payment */}
                  <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                    <div>{getPaymentStatusBadge(order.paymentStatus)}</div>
                    <p className="text-[10px] text-neutral-400">
                      {order.paymentMethod}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getOrderStatusBadge(order.status)}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-neutral-900 font-mono">
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
