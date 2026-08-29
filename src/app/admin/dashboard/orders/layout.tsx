"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import {
  AdminPageHeader,
  AdminContent,
} from "@/components/admin/AdminPageHeader";
import { OrderStatsCards } from "@/features/orders/components/OrderStatsCards";
import { OrderStatusTabs } from "@/features/orders/components/OrderStatusTabs";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <AdminBreadcrumb items={[{ label: "Sales" }, { label: "Orders" }]} />
      <AdminPageHeader
        title="Orders"
        description="View, manage and fulfill customer orders"
      />

      <div className="mt-4 flex flex-col gap-3">
        {/* Order Statistics - Shared across all status pages */}
        <OrderStatsCards />

        {/* Status Tabs Navigation - Shared across all status pages */}
        <div className="mt-1">
          <OrderStatusTabs />
        </div>
      </div>

      <AdminContent className="mt-3 flex-1 min-h-0 overflow-hidden">
        {children}
      </AdminContent>
    </div>
  );
}
