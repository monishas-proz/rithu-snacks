import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { Prisma, ShippingStatus } from "@/generated/prisma";
import { generateOrderNumber, formatPrice } from "@/lib/utils";
import { orderRepository } from "../repositories/order.repository";
import { DELIVERY_OPTIONS } from "../constants";
import type {
  CheckoutSummary,
  DeliveryMethod,
  GetOrdersParams,
  OrderDetail,
  OrderItemDisplay,
  OrderListItem,
  OrderStatus,
  PaymentMethod,
  PlaceOrderInput,
  UpdateOrderStatusInput,
} from "../types";

type TxClient = Prisma.TransactionClient;

const ORDER_ITEMS_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      taxRate: true,
      images: { take: 1, orderBy: { isPrimary: "desc" } },
    },
  },
  variant: { select: { id: true, name: true, sku: true } },
} satisfies Prisma.OrderItemInclude;

const ORDER_DETAIL_INCLUDE = {
  items: {
    include: ORDER_ITEMS_INCLUDE,
  },
  address: true,
  payments: true,
  delivery: true,
  shipping: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

const CART_ITEMS_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      taxRate: true,
      images: { take: 1, orderBy: { isPrimary: "desc" } },
    },
  },
  variant: true,
} satisfies Prisma.CartItemInclude;

const CUSTOMER_CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getDeliveryCost(method: DeliveryMethod): number {
  return DELIVERY_OPTIONS[method]?.cost ?? 0;
}

function mapOrderItems(items: Array<Record<string, unknown>>): OrderItemDisplay[] {
  return items.map((item) => {
    const product = item.product as {
      id: number;
      name: string;
      slug: string;
      sku: string;
      images: { id: number; url: string; altText: string | null }[];
    };
    const variant = item.variant as {
      id: number;
      name: string;
      sku: string;
    } | null;

    return {
      id: item.id as number,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      image: product.images[0]?.url ?? null,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      sku: variant?.sku ?? product.sku,
      quantity: item.quantity as number,
      price: Number(item.price),
      total: Number(item.total),
    };
  });
}

function mapOrderListItem(order: Record<string, unknown>): OrderListItem {
  const user = order.user as {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  const payment = (order.payments as Array<Record<string, unknown>>)?.[0] ?? null;
  const delivery = order.delivery as Record<string, unknown> | null;
  const items = (order.items as Array<Record<string, unknown>>) ?? [];

  return {
    id: order.id as number,
    orderNumber: order.orderNumber as string,
    status: order.status as OrderStatus,
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    shippingAmount: Number(order.shippingAmount),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    totalItems: items.reduce((sum, item) => sum + (item.quantity as number), 0),
    couponCode: order.couponCode as string | null,
    createdAt: order.createdAt as Date,
    user,
    items: mapOrderItems(items),
    payment: payment
      ? {
          id: payment.id as number,
          method: payment.method as PaymentMethod,
          status: payment.status as OrderDetail["payments"][number]["status"],
          amount: Number(payment.amount),
          currency: payment.currency as string,
          reference: (payment.reference as string | null) ?? null,
        }
      : null,
    delivery: delivery
      ? {
          id: delivery.id as number,
          method: delivery.method as DeliveryMethod,
          cost: Number(delivery.cost),
          status: delivery.status as string,
          createdAt: delivery.createdAt as Date,
        }
      : null,
  };
}

function mapOrderDetail(order: Record<string, unknown>): OrderDetail {
  const base = mapOrderListItem(order);
  const { delivery: _baseDelivery, ...baseRest } = base;
  const address = order.address as Record<string, unknown> | null;
  const shipping = order.shipping as Record<string, unknown> | null;
  const payments = (order.payments as Array<Record<string, unknown>>) ?? [];

  return {
    ...baseRest,
    items: mapOrderItems((order.items as Array<Record<string, unknown>>) ?? []),
    address: address
      ? {
          id: address.id as number,
          firstName: address.firstName as string,
          lastName: address.lastName as string,
          email: address.email as string,
          phone: address.phone as string,
          addressLine1: address.addressLine1 as string,
          addressLine2: (address.addressLine2 as string | null) ?? null,
          city: address.city as string,
          state: address.state as string,
          postalCode: address.postalCode as string,
          country: address.country as string,
        }
      : null,
    payments: payments.map((p) => ({
      id: p.id as number,
      method: p.method as PaymentMethod,
      status: p.status as OrderDetail["payments"][number]["status"],
      amount: Number(p.amount),
      currency: p.currency as string,
      reference: (p.reference as string | null) ?? null,
    })),
    shipping: shipping
      ? {
          id: shipping.id as number,
          carrier: (shipping.carrier as string | null) ?? null,
          trackingNumber: (shipping.trackingNumber as string | null) ?? null,
          status: shipping.status as string,
          estimatedDelivery: (shipping.estimatedDelivery as Date | null) ?? null,
          actualDelivery: (shipping.actualDelivery as Date | null) ?? null,
        }
      : null,
    delivery: (base.delivery as OrderListItem["delivery"]) ?? null,
    notes: (order.notes as string | null) ?? null,
  };
}

function computeItems(items: Array<Record<string, unknown>>) {
  let subtotal = 0;
  let taxAmount = 0;
  let count = 0;

  const displayItems = items.map((item) => {
    const quantity = item.quantity as number;
    const price = Number(item.price);
    const itemTotal = round2(price * quantity);
    const product = item.product as { taxRate?: unknown } | undefined;
    const taxRate = product?.taxRate ? Number(product.taxRate) : 0;
    const tax = round2((itemTotal * taxRate) / 100);

    subtotal += itemTotal;
    taxAmount += tax;
    count += quantity;
    return { quantity, price, tax, itemTotal };
  });

  return {
    displayItems,
    subtotal: round2(subtotal),
    taxAmount: round2(taxAmount),
    count,
  };
}

async function resolveCoupon(
  client: Pick<TxClient, "coupon">,
  code: string,
  subtotal: number
) {
  const coupon = await client.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon) {
    throw ApiError.badRequest("Invalid coupon code");
  }
  if (!coupon.isActive) {
    throw ApiError.badRequest("This coupon is not active");
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw ApiError.badRequest("This coupon is not yet valid");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw ApiError.badRequest("This coupon has expired");
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest("This coupon has reached its usage limit");
  }
  if (
    coupon.minOrderAmount != null &&
    subtotal < Number(coupon.minOrderAmount)
  ) {
    throw ApiError.badRequest(
      `Minimum order amount of ${formatPrice(Number(coupon.minOrderAmount))} required for this coupon`
    );
  }

  let discount =
    coupon.type === "PERCENTAGE"
      ? (subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);

  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, Number(coupon.maxDiscount));
  }
  discount = Math.min(discount, subtotal);

  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount: round2(discount),
  };
}

async function validateCartItemsStock(
  tx: TxClient,
  items: Array<{
    productId: number;
    variantId: number | null;
    quantity: number;
  }>
) {
  for (const item of items) {
    if (item.variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stockQuantity: true },
      });
      if (!variant) {
        throw ApiError.badRequest("A product in your cart is no longer available");
      }
      if (variant.stockQuantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for a product in your cart. Available: ${variant.stockQuantity}, Requested: ${item.quantity}`
        );
      }
    } else {
      const inventory = await tx.inventory.findFirst({
        where: { productId: item.productId, variantId: null },
      });
      if (inventory && inventory.quantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for a product in your cart. Available: ${inventory.quantity}, Requested: ${item.quantity}`
        );
      }
    }
  }
}

async function deductStock(
  tx: TxClient,
  items: Array<{
    productId: number;
    variantId: number | null;
    quantity: number;
  }>,
  orderId: number
) {
  for (const item of items) {
    if (item.variantId) {
      const inventory = await tx.inventory.findFirst({
        where: { productId: item.productId, variantId: item.variantId },
      });

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { decrement: item.quantity } },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            inventory: { connect: { id: inventory.id } },
            type: "SALE",
            quantity: -item.quantity,
            referenceType: "ORDER",
            referenceId: orderId,
            notes: `Order ${orderId}`,
          },
        });
      }
    } else {
      const inventory = await tx.inventory.findFirst({
        where: { productId: item.productId, variantId: null },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            inventory: { connect: { id: inventory.id } },
            type: "SALE",
            quantity: -item.quantity,
            referenceType: "ORDER",
            referenceId: orderId,
            notes: `Order ${orderId}`,
          },
        });
      }
    }
  }
}

export const orderService = {
  async getCheckoutSummary(
    userId: number,
    deliveryMethod: DeliveryMethod = "STANDARD",
    couponCode?: string
  ): Promise<CheckoutSummary> {
    const cart = await db.cart.findUnique({
      where: { userId },
      include: { items: { include: CART_ITEMS_INCLUDE } },
    });

    if (!cart || cart.items.length === 0) {
      return {
        items: [],
        totals: {
          subtotal: 0,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          totalAmount: 0,
        },
        count: 0,
        coupon: null,
        delivery: {
          method: deliveryMethod,
          label: DELIVERY_OPTIONS[deliveryMethod].label,
          cost: DELIVERY_OPTIONS[deliveryMethod].cost,
        },
      };
    }

    const { displayItems, subtotal, taxAmount, count } = computeItems(
      cart.items as unknown as Array<Record<string, unknown>>
    );

    let coupon: CheckoutSummary["coupon"] = null;
    let discountAmount = 0;

    if (couponCode) {
      const resolved = await resolveCoupon(db, couponCode, subtotal);
      coupon = {
        code: resolved.code,
        type: resolved.type,
        value: resolved.value,
        discountAmount: resolved.discount,
      };
      discountAmount = resolved.discount;
    }

    const shippingAmount = getDeliveryCost(deliveryMethod);
    const totalAmount = round2(
      Math.max(0, subtotal + taxAmount + shippingAmount - discountAmount)
    );

    const items: OrderItemDisplay[] = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      variantId: item.variantId,
      variantName: item.variant?.name ?? null,
      sku: item.variant?.sku ?? item.product.sku,
      quantity: item.quantity,
      price: Number(item.price),
      total: round2(Number(item.price) * item.quantity),
    }));

    return {
      items,
      totals: {
        subtotal: round2(subtotal),
        taxAmount: round2(taxAmount),
        shippingAmount: round2(shippingAmount),
        discountAmount: round2(discountAmount),
        totalAmount,
      },
      count,
      coupon,
      delivery: {
        method: deliveryMethod,
        label: DELIVERY_OPTIONS[deliveryMethod].label,
        cost: getDeliveryCost(deliveryMethod),
      },
    };
  },

  async placeOrder(userId: number, input: PlaceOrderInput): Promise<OrderDetail> {
    const address = await db.customerAddress.findFirst({
      where: { id: input.addressId, userId },
    });

    if (!address) {
      throw ApiError.notFound("Address not found");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const deliveryMethod = input.deliveryMethod ?? "STANDARD";

    const order = await db.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: CART_ITEMS_INCLUDE } },
      });

      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest("Cart is empty");
      }

      await validateCartItemsStock(
        tx,
        cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        }))
      );

      const { subtotal, taxAmount, count } = computeItems(
        cart.items as unknown as Array<Record<string, unknown>>
      );

      let couponResult: Awaited<ReturnType<typeof resolveCoupon>> | null = null;
      if (input.couponCode) {
        couponResult = await resolveCoupon(tx, input.couponCode, subtotal);
      }

      const shippingAmount = getDeliveryCost(deliveryMethod);
      const discountAmount = couponResult?.discount ?? 0;
      const totalAmount = round2(
        Math.max(0, subtotal + taxAmount + shippingAmount - discountAmount)
      );

      const created = await tx.order.create({
        data: {
          userId,
          orderNumber: generateOrderNumber(),
          status: "PENDING",
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
          couponId: couponResult?.id ?? null,
          notes: input.notes ?? null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: Number(item.price),
              total: round2(Number(item.price) * item.quantity),
            })),
          },
          address: {
            create: {
              firstName: address.firstName,
              lastName: address.lastName,
              email: user?.email ?? "",
              phone: address.phone,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            },
          },
          payments: {
            create: {
              method: input.paymentMethod,
              status: "PENDING",
              amount: totalAmount,
              currency: "INR",
            },
          },
          delivery: {
            create: {
              method: deliveryMethod,
              cost: shippingAmount,
              status: "PENDING",
            },
          },
        },
      });

      await deductStock(
        tx,
        cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        created.id
      );

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (couponResult) {
        await tx.coupon.update({
          where: { id: couponResult.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: ORDER_DETAIL_INCLUDE,
      });
    });

    return mapOrderDetail(order as unknown as Record<string, unknown>);
  },

  async getOrders(userId: number, params: GetOrdersParams = {}) {
    const result = await orderRepository.findAllForCustomer(userId, params);

    const couponIds = Array.from(
      new Set(
        result.data
          .map((order) => order.couponId)
          .filter((id): id is number => id != null)
      )
    );
    const coupons = couponIds.length
      ? await db.coupon.findMany({ where: { id: { in: couponIds } } })
      : [];
    const couponMap = new Map(coupons.map((c) => [c.id, c.code]));

    return {
      data: result.data.map((order) =>
        mapOrderListItem({
          ...order,
          couponCode: order.couponId ? couponMap.get(order.couponId) ?? null : null,
        } as unknown as Record<string, unknown>)
      ),
      meta: result.meta,
    };
  },

  async getOrder(userId: number, id: number): Promise<OrderDetail> {
    const order = await orderRepository.findByIdForCustomer(userId, id);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    const coupon = order.couponId
      ? await db.coupon.findUnique({ where: { id: order.couponId } })
      : null;

    return mapOrderDetail({
      ...order,
      couponCode: coupon?.code ?? null,
    } as unknown as Record<string, unknown>);
  },

  async getAdminOrders(params: GetOrdersParams = {}) {
    const result = await orderRepository.findAll(params);

    const couponIds = Array.from(
      new Set(
        result.data
          .map((order) => order.couponId)
          .filter((id): id is number => id != null)
      )
    );
    const coupons = couponIds.length
      ? await db.coupon.findMany({ where: { id: { in: couponIds } } })
      : [];
    const couponMap = new Map(coupons.map((c) => [c.id, c.code]));

    return {
      data: result.data.map((order) =>
        mapOrderListItem({
          ...order,
          couponCode: order.couponId ? couponMap.get(order.couponId) ?? null : null,
        } as unknown as Record<string, unknown>)
      ),
      meta: result.meta,
    };
  },

  async getAdminOrder(id: number): Promise<OrderDetail> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    const coupon = order.couponId
      ? await db.coupon.findUnique({ where: { id: order.couponId } })
      : null;

    return mapOrderDetail({
      ...order,
      couponCode: coupon?.code ?? null,
    } as unknown as Record<string, unknown>);
  },

  async getOrderByNumber(orderNumber: string): Promise<OrderDetail | null> {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) return null;

    const coupon = order.couponId
      ? await db.coupon.findUnique({ where: { id: order.couponId } })
      : null;

    return mapOrderDetail({
      ...order,
      couponCode: coupon?.code ?? null,
    } as unknown as Record<string, unknown>);
  },

  async updateOrderStatus(id: number, input: UpdateOrderStatusInput): Promise<OrderDetail> {
    const existing = await orderRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Order not found");
    }

    if (
      existing.status === "CANCELLED" ||
      existing.status === "REFUNDED" ||
      existing.status === "RETURNED"
    ) {
      throw ApiError.badRequest(`Cannot update a ${existing.status} order`);
    }

    const updated = await orderRepository.updateStatus(id, input.status);

    const shippingStatusMap: Record<string, string> = {
      PROCESSING: "PROCESSING",
      SHIPPED: "SHIPPED",
      DELIVERED: "DELIVERED",
      RETURNED: "RETURNED",
    };

    if (shippingStatusMap[input.status]) {
      await db.shipping.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          status: shippingStatusMap[input.status] as ShippingStatus,
        },
        update: {
          status: shippingStatusMap[input.status] as ShippingStatus,
          actualDelivery:
            input.status === "DELIVERED" ? new Date() : undefined,
        },
      });
    }

    if (input.status === "DELIVERED") {
      await orderRepository.updatePaymentStatus(id, "COMPLETED");
    }

    const fresh = await orderRepository.findById(id);
    return mapOrderDetail(fresh as unknown as Record<string, unknown>);
  },

  async cancelOrder(
    userId: number,
    id: number,
    reason?: string
  ): Promise<OrderDetail> {
    const order = await orderRepository.findByIdForCustomer(userId, id);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
      throw ApiError.badRequest(
        "Order can only be cancelled while it is pending or confirmed"
      );
    }

    return this.cancelOrderInternal(id, reason);
  },

  async cancelOrderAdmin(id: number, reason?: string): Promise<OrderDetail> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (
      order.status === "CANCELLED" ||
      order.status === "DELIVERED" ||
      order.status === "REFUNDED"
    ) {
      throw ApiError.badRequest(`Cannot cancel a ${order.status} order`);
    }

    return this.cancelOrderInternal(id, reason);
  },

  async cancelOrderInternal(id: number, reason?: string): Promise<OrderDetail> {
    const updated = await db.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      await tx.payment.updateMany({
        where: { orderId: id },
        data: { status: "CANCELLED" },
      });

      const items = await tx.orderItem.findMany({
        where: { orderId: id },
      });

      for (const item of items) {
        if (item.variantId) {
          const inventory = await tx.inventory.findFirst({
            where: { productId: item.productId, variantId: item.variantId },
          });

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: { increment: item.quantity } },
            });
            await tx.inventoryTransaction.create({
              data: {
                inventory: { connect: { id: inventory.id } },
                type: "RETURN",
                quantity: item.quantity,
                referenceType: "ORDER",
                referenceId: id,
                notes: reason ?? `Order ${id} cancelled`,
              },
            });
          }
        } else {
          const inventory = await tx.inventory.findFirst({
            where: { productId: item.productId, variantId: null },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: { increment: item.quantity } },
            });
            await tx.inventoryTransaction.create({
              data: {
                inventory: { connect: { id: inventory.id } },
                type: "RETURN",
                quantity: item.quantity,
                referenceType: "ORDER",
                referenceId: id,
                notes: reason ?? `Order ${id} cancelled`,
              },
            });
          }
        }
      }

      if (order.couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: order.couponId },
        });
        if (coupon && coupon.usedCount > 0) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: ORDER_DETAIL_INCLUDE,
      });
    });

    return mapOrderDetail(updated as unknown as Record<string, unknown>);
  },
};
