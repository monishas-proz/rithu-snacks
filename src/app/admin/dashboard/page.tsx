"use client";

import { useSession } from "next-auth/react";
import {
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { formatPrice } from "@/lib/utils";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminPageHeader, AdminContent } from "@/components/admin/AdminPageHeader";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return <LoadingState text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load dashboard stats. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={`Welcome back, ${session?.user?.name || "Admin"}`}
        description="Here's what's happening with your store today."
        breadcrumbs={<AdminBreadcrumb items={[{ label: "Dashboard" }]} />}
      />

      <AdminContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts ?? 0}
            icon={Package}
            description="All products in store"
          />
          <StatsCard
            title="Total Categories"
            value={stats?.totalCategories ?? 0}
            icon={FolderTree}
            description="Product categories"
          />
          <StatsCard
            title="Total Customers"
            value={stats?.totalCustomers ?? 0}
            icon={Users}
            description="Registered customers"
          />
          <StatsCard
            title="Total Orders"
            value={stats?.totalOrders ?? 0}
            icon={ShoppingCart}
            description="All time orders"
          />
          <StatsCard
            title="Revenue"
            value={formatPrice(stats?.totalRevenue ?? 0)}
            icon={DollarSign}
            description="Total revenue"
          />
          <StatsCard
            title="Pending Orders"
            value={stats?.pendingOrders ?? 0}
            icon={Clock}
            description="Awaiting processing"
          />
          <StatsCard
            title="Low Stock"
            value={stats?.lowStock ?? 0}
            icon={AlertTriangle}
            description="Items below reorder level"
          />
          <StatsCard
            title="Today's Orders"
            value={stats?.todayOrders ?? 0}
            icon={Calendar}
            description="Orders placed today"
          />
        </div>
      </AdminContent>
    </div>
  );
}
