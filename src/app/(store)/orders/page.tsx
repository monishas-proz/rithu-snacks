"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Package, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { useCustomerOrders } from "@/features/customers/hooks/use-customer-orders";
import { ORDER_STATUS_LABELS } from "@/features/orders/components/OrderStatusBadge";
import type { OrderStatus } from "@/features/orders/types";

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error, refetch } = useCustomerOrders({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  if (status === "loading" || isLoading) {
    return <LoadingState text="Loading your orders..." />;
  }

  if (status === "unauthenticated" || !session) {
    router.push("/login?callbackUrl=/orders");
    return null;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load orders. Please try again."
        onRetry={refetch}
      />
    );
  }

  const orders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage your orders.
          </p>
        </div>
        <Link href="/products">
          <Button variant="outline">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      <div className="mb-6 max-w-xs">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by status"
          options={[
            ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order, it will appear here."
          icon={<Package className="h-8 w-8 text-muted-foreground" />}
        >
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
