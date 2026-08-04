"use client";

import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderListItem } from "../types";

interface OrderCardProps {
  order: OrderListItem;
}

export function OrderCard({ order }: OrderCardProps) {
  const previewItems = order.items?.slice(0, 3) ?? [];

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {order.totalItems} item{order.totalItems === 1 ? "" : "s"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="text-lg font-bold">{formatPrice(order.totalAmount)}</p>
            </div>
          </div>

          {previewItems.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                {order.items?.slice(3).length
                  ? `+${order.items.slice(3).length} more`
                  : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
