"use client";

import React from "react";
import { formatPrice } from "@/lib/utils";
import type { CustomerProfileResponse } from "../../types";
import type { OrderListItem } from "@/features/orders/types";

interface DashboardTabProps {
  profile?: CustomerProfileResponse | null;
  orders?: OrderListItem[];
  wishlistCount?: number;
  onNavigateTab: (tab: string) => void;
  onAddToCart?: (productId: number) => void;
}

export function DashboardTab({
  profile,
  orders = [],
  wishlistCount = 0,
  onNavigateTab,
}: DashboardTabProps) {
  const userName = profile?.name || "Customer";

  // Calculate live statistics
  const totalOrdersCount = orders.length;
  const lifetimeSpend = orders.reduce((sum, order) => {
    const val = typeof order.totalAmount === "number" ? order.totalAmount : Number(order.totalAmount || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Find active / ongoing order if any
  const activeOrder = orders.find(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );

  // Extract past ordered items for "Buy Again"
  const pastItemsMap = new Map<string, { id?: string; name: string; price: number }>();
  orders.forEach((o) => {
    o.items?.forEach((item) => {
      const key = item.productName || "";
      if (key && !pastItemsMap.has(key)) {
        pastItemsMap.set(key, {
          id: item.productId || undefined,
          name: key,
          price: typeof item.unitPrice === "number" ? item.unitPrice : Number(item.unitPrice || 0),
        });
      }
    });
  });
  const buyAgainItems = Array.from(pastItemsMap.values()).slice(0, 4);

  // Determine stepper steps for active order
  const getTrackingStepIndex = (status?: string) => {
    switch (status) {
      case "pending":
      case "confirmed":
        return 0;
      case "processing":
      case "packed":
        return 1;
      case "out_for_delivery":
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = activeOrder ? getTrackingStepIndex(activeOrder.status) : 0;
  const trackingSteps = [
    { label: "Order Placed", time: activeOrder?.createdAt ? new Date(activeOrder.createdAt).toLocaleDateString() : "" },
    { label: "Packed", time: currentStep >= 1 ? "In progress" : "Pending" },
    { label: "Out for delivery", time: currentStep >= 2 ? "Out for delivery" : "Pending" },
    { label: "Delivered", time: currentStep >= 3 ? "Delivered" : "Expected soon" },
  ];

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-theme-primary via-theme-primary-hover to-[#8C2A1E] rounded-2xl p-6 sm:p-7 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-theme-secondary font-medium">
            Welcome back
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">
            {userName}
          </h2>
          <p className="text-xs sm:text-sm text-[#E6CDAE] font-light max-w-lg leading-relaxed">
            {activeOrder
              ? `You have 1 order in progress (${activeOrder.orderNumber || `#${activeOrder.id}`}) and active loyalty rewards ready to use.`
              : "Manage your profile, browse your orders, and explore authentic homemade snacks."}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-3 px-5 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              View Orders
            </button>
          )}
          {activeOrder && (
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="border border-theme-secondary hover:bg-theme-secondary/10 text-theme-secondary text-xs font-semibold uppercase tracking-wider py-3 px-5 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Track Order
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-theme-surface border border-theme-border rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-bold text-theme-primary">
            {totalOrdersCount}
          </div>
          <div className="text-xs text-theme-text-muted mt-1.5 font-medium">
            Orders placed
          </div>
        </div>

        <div className="bg-theme-surface border border-theme-border rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-bold text-theme-primary">
            {formatPrice(lifetimeSpend)}
          </div>
          <div className="text-xs text-theme-text-muted mt-1.5 font-medium">
            Lifetime spend
          </div>
        </div>

        <div className="bg-theme-surface border border-theme-border rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-bold text-theme-primary">
            {profile?.referralCode ? "Active" : "Standard"}
          </div>
          <div className="text-xs text-theme-text-muted mt-1.5 font-medium">
            Member Status
          </div>
        </div>

        <div className="bg-theme-surface border border-theme-border rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-bold text-theme-primary">
            {wishlistCount}
          </div>
          <div className="text-xs text-theme-text-muted mt-1.5 font-medium">
            Wishlist items
          </div>
        </div>
      </div>

      {/* Current Order Tracker Card (Conditional: only shown if an active order exists) */}
      {activeOrder && (
        <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-theme-border-subtle bg-theme-surface-alt">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
              Current Order
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="text-xs font-medium text-theme-primary hover:text-theme-secondary transition-colors cursor-pointer"
            >
              View all orders &rarr;
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm text-theme-text-primary">
                  Order {activeOrder.orderNumber || `#${activeOrder.id}`}
                </div>
                <div className="text-xs text-theme-text-muted mt-1">
                  Placed on {new Date(activeOrder.createdAt).toLocaleDateString()} · {activeOrder.items?.length || 1} items · {formatPrice(activeOrder.totalAmount)}
                </div>
              </div>

              <span className="bg-theme-status-out-bg text-theme-status-out-fg text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                {activeOrder.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-4 gap-0 items-start pt-2">
              {trackingSteps.map((step, idx) => {
                const isDone = idx <= currentStep;
                const isActive = idx === currentStep;
                const isLast = idx === trackingSteps.length - 1;

                return (
                  <div key={step.label} className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 transition-colors ${
                          isDone ? "bg-[#3F8F5E]" : isActive ? "bg-theme-secondary" : "bg-theme-border"
                        }`}
                      />
                      {!isLast && (
                        <span
                          className={`h-0.5 flex-1 transition-colors ${
                            idx < currentStep ? "bg-[#3F8F5E]" : "bg-theme-border"
                          }`}
                        />
                      )}
                    </div>
                    <div
                      className={`text-xs font-semibold leading-tight pr-2 ${
                        isDone || isActive ? "text-theme-text-primary" : "text-theme-text-muted"
                      }`}
                    >
                      {step.label}
                    </div>
                    {step.time && (
                      <div className="text-[11px] text-theme-text-muted pr-2">
                        {step.time}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Buy Again (Conditional: only shown if customer previously ordered items) */}
      {buyAgainItems.length > 0 && (
        <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-theme-border-subtle bg-theme-surface-alt">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-secondary">
              Buy Again
            </h3>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {buyAgainItems.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="border border-theme-border-subtle rounded-xl overflow-hidden bg-theme-surface-warm flex flex-col justify-between"
              >
                <div className="h-28 bg-[repeating-linear-gradient(45deg,#F6ECDC,#F6ECDC_8px,#EFE2CD_8px,#EFE2CD_16px)] flex items-center justify-center">
                  <span className="text-[10px] font-mono text-theme-text-muted uppercase tracking-wider">
                    {item.name.slice(0, 14)}
                  </span>
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase text-theme-text-primary line-clamp-2 min-h-[32px]">
                      {item.name}
                    </div>
                    <div className="text-sm font-semibold text-theme-primary mt-1.5">
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab("orders")}
                    className="w-full bg-theme-secondary hover:bg-theme-secondary-hover text-theme-secondary-fg text-xs font-semibold uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer min-h-[40px]"
                  >
                    View in Orders
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
