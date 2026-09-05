"use client";

import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ProductImage } from "@/components/common/ProductImage";
import type { OrderListItem, OrderListItemResponse, OrderDetailResponse } from "../types";

export type AnyOrderListItem = OrderListItem | OrderDetailResponse | OrderListItemResponse;

interface OrderCardProps {
  order: AnyOrderListItem;
}

export function OrderCard({ order }: OrderCardProps) {
  const anyOrder = order as any;
  const items: any[] = anyOrder.items ?? [];
  const previewItems = items.slice(0, 3);
  const totalCount = anyOrder.totalItems ?? items.length ?? 0;

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
                {totalCount} item{totalCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="text-lg font-bold">{formatPrice(order.totalAmount)}</p>
            </div>
          </div>

          {previewItems.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              {previewItems.map((item: any) => (
                <div
                  key={item.id}
                  className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                >
                  <ProductImage
                    src={item.primaryImage || item.image}
                    alt={item.productName}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                {items.length > 3 ? `+${items.length - 3} more` : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
