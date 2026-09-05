"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCustomerOrderDetail, useCancelCustomerOrder } from "@/features/customers/hooks/use-customer-orders";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import type { OrderStatus } from "@/features/orders/types";

const CUSTOMER_CANCELLABLE: OrderStatus[] = ["pending", "confirmed"];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: order, isLoading, error, refetch } = useCustomerOrderDetail(id);
  const cancelOrderMutation = useCancelCustomerOrder();

  if (status === "loading" || isLoading) {
    return <LoadingState text="Loading order details..." />;
  }

  if (status === "unauthenticated" || !session) {
    router.push(`/login?callbackUrl=/orders/${id}`);
    return null;
  }

  if (error) {
    return (
      <ErrorState
        title="Order not found"
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  if (!order) {
    return <ErrorState title="Order not found" />;
  }

  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push("/orders")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <OrderDetailView
        order={order}
        canCancel={canCancel}
        isCancelling={cancelOrderMutation.isPending}
        onCancel={() => setCancelOpen(true)}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelOrderMutation.mutate(
            { uuid: order.id },
            {
              onSuccess: () => setCancelOpen(false),
            }
          );
        }}
        title="Cancel Order"
        description={`Are you sure you want to cancel order ${order.orderNumber}? Your items will be returned to stock.`}
        confirmText="Cancel Order"
        variant="destructive"
        isLoading={cancelOrderMutation.isPending}
      />
    </div>
  );
}
