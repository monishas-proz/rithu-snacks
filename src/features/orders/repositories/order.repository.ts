import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import { formatVariantMeasurement } from "@/features/variants/utils/measurement.util";
import type {
  OrderDetailResponse,
  OrderListItemResponse,
  OrderItemResponse,
  OrderAddressResponse,
  OrderStatusHistoryResponse,
  OrderListResponse,
} from "../types";
import type {
  CustomerOrdersQueryInput,
  AdminOrdersListInput,
} from "../validations/order.schema";

export const orderAddressInclude = Prisma.validator<Prisma.OrderAddressInclude>()({});

export const orderItemInclude = Prisma.validator<Prisma.OrderItemInclude>()({
  product: {
    select: {
      id: true,
      uuid: true,
      name: true,
      images: {
        where: { is_active: true },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
      },
    },
  },
  variant: {
    select: {
      id: true,
      uuid: true,
      variant_name: true,
      sku: true,
      unit_value: true,
      product_units: {
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
        },
      },
      product_variant_images: {
        where: { is_active: true },
        orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
        take: 1,
      },
    },
  },
});

export const orderDetailInclude = Prisma.validator<Prisma.OrderInclude>()({
  user: {
    select: {
      id: true,
      uuid: true,
      cust_id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  address: {
    where: { is_active: true },
  },
  items: {
    where: { is_active: true },
    include: orderItemInclude,
  },
  order_status_history: {
    where: { is_active: true },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  },
  shipments: {
    where: { is_active: true },
    orderBy: { id: "desc" },
    take: 1,
    include: {
      delivery_staff: {
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  },
});

export function formatOrderAddress(
  address?: Prisma.OrderAddressGetPayload<typeof orderAddressInclude> | null
): OrderAddressResponse | null {
  if (!address) return null;
  return {
    id: address.uuid || String(address.id),
    type: address.type,
    fullName: address.full_name,
    phone: address.phone,
    addressLine1: address.address_line1,
    addressLine2: address.address_line2 ?? null,
    landmark: address.landmark ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    latitude: address.latitude ? Number(address.latitude) : null,
    longitude: address.longitude ? Number(address.longitude) : null,
  };
}

export function formatOrderItem(
  item: Prisma.OrderItemGetPayload<{ include: typeof orderItemInclude }>
): OrderItemResponse {
  const measurement = formatVariantMeasurement(
    item.variant?.product_units,
    item.variant?.unit_value
  );

  const primaryImage =
    item.variant?.product_variant_images?.[0]?.image_url ||
    item.product?.images?.[0]?.image_url ||
    null;

  return {
    id: item.uuid || String(item.id),
    productId: item.product?.uuid || String(item.productId),
    variantId: item.variant?.uuid || String(item.variantId),
    productName: item.product_name_snapshot,
    variantName: item.variant_snapshot,
    sku: item.sku_snapshot,
    measurement,
    primaryImage,
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    taxAmount: Number(item.tax_amount),
    totalPrice: Number(item.total_price),
  };
}

export function formatOrderStatusHistory(
  history: Prisma.order_status_historyGetPayload<{}>
): OrderStatusHistoryResponse {
  return {
    id: String(history.id),
    status: history.status,
    note: history.note ?? null,
    createdAt: history.created_at,
  };
}

export function formatOrderDelivery(
  shipments?: Array<{
    id: bigint;
    uuid: string | null;
    assignment_status: string | null;
    created_at: Date;
    accepted_at: Date | null;
    delivered_at: Date | null;
    delivery_staff?: {
      id: bigint;
      uuid: string | null;
      name: string;
      email?: string | null;
      phone: string | null;
    } | null;
  }> | null
) {
  if (!shipments || shipments.length === 0) {
    return {
      isAssigned: false,
      assignmentStatus: null,
      deliveryId: null,
      staff: null,
      assignedAt: null,
    };
  }

  const latest = shipments[0];
  const staff = latest.delivery_staff;

  const isAssigned = latest.assignment_status !== null;

  return {
    isAssigned,
    assignmentStatus: latest.assignment_status || null,
    deliveryId: latest.uuid || String(latest.id),
    staff: staff
      ? {
          id: staff.uuid || String(staff.id),
          name: staff.name,
          email: staff.email ?? null,
          phone: staff.phone ?? null,
        }
      : null,
    assignedAt: latest.created_at ? latest.created_at.toISOString() : null,
  };
}

export function formatOrderDetail(
  order: Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>
): OrderDetailResponse {
  const customer = {
    id: order.user?.uuid || String(order.userId),
    customerId: order.user?.cust_id ?? null,
    name: order.user?.name || "",
    email: order.user?.email ?? null,
    phone: order.user?.phone ?? null,
  };

  const items = (order.items || []).map(formatOrderItem);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const shippingRaw = (order.address || []).find((a) => a.type === "shipping");
  const billingRaw = (order.address || []).find((a) => a.type === "billing");

  const shippingAddress = formatOrderAddress(shippingRaw);
  const billingAddress = formatOrderAddress(billingRaw || shippingRaw);

  const statusHistory = (order.order_status_history || []).map(
    formatOrderStatusHistory
  );

  return {
    id: order.uuid || String(order.id),
    orderNumber: order.orderNumber,
    customer,
    status: order.order_status,
    paymentStatus: order.payment_status,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    shippingCharge: Number(order.shipping_charge),
    totalAmount: Number(order.totalAmount),
    totalItems,
    delivery: formatOrderDelivery((order as any).shipments),
    notes: order.notes ?? null,
    placedAt: order.placed_at ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items,
    shippingAddress,
    billingAddress,
    statusHistory,
  };
}

export function formatOrderListItem(
  order: Prisma.OrderGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          uuid: true;
          cust_id: true;
          name: true;
          email: true;
          phone: true;
        };
      };
      items: {
        where: { is_active: true };
        select: { quantity: true };
      };
    };
  }>
): OrderListItemResponse {
  const customer = {
    id: order.user?.uuid || String(order.userId),
    customerId: order.user?.cust_id ?? null,
    name: order.user?.name || "",
    email: order.user?.email ?? null,
    phone: order.user?.phone ?? null,
  };

  const totalItems = (order.items || []).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    id: order.uuid || String(order.id),
    orderNumber: order.orderNumber,
    customer,
    status: order.order_status,
    paymentStatus: order.payment_status,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    shippingCharge: Number(order.shipping_charge),
    totalAmount: Number(order.totalAmount),
    totalItems,
    delivery: formatOrderDelivery((order as any).shipments),
    notes: order.notes ?? null,
    placedAt: order.placed_at ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function generateUniqueOrderNumber(
  prismaClient: Prisma.TransactionClient | typeof db = db
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  for (let i = 0; i < 10; i++) {
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomHex}`;

    const existing = await prismaClient.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!existing) {
      return orderNumber;
    }
  }

  // Fallback with timestamp
  return `ORD-${dateStr}-${Date.now().toString().slice(-6)}`;
}

export const orderRepository = {
  async createCustomerOrderTransaction(params: {
    userId: bigint;
    cartId: bigint;
    subtotal: number;
    totalAmount: number;
    notes?: string;
    shippingAddress: {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      pincode?: string | null;
      country?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    };
    billingAddress: {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      pincode?: string | null;
      country?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    };
    items: Array<{
      productId: bigint;
      variantId: bigint;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      taxAmount: number;
      totalPrice: number;
    }>;
  }): Promise<OrderDetailResponse> {
    return db.$transaction(async (tx) => {
      const orderNumber = await generateUniqueOrderNumber(tx);
      const now = new Date();

      // 1. Create Order
      const createdOrder = await tx.order.create({
        data: {
          uuid: crypto.randomUUID(),
          orderNumber,
          userId: params.userId,
          cart_id: params.cartId,
          order_status: "pending",
          payment_status: "pending",
          subtotal: params.subtotal,
          discountAmount: 0,
          taxAmount: 0,
          shipping_charge: 0,
          totalAmount: params.totalAmount,
          notes: params.notes ?? null,
          placed_at: now,
          is_active: true,
          created_by: params.userId,
          updated_by: params.userId,
        },
      });

      // 2. Create Addresses (Shipping & Billing)
      await tx.orderAddress.createMany({
        data: [
          {
            uuid: crypto.randomUUID(),
            orderId: createdOrder.id,
            type: "shipping",
            full_name: params.shippingAddress.fullName,
            phone: params.shippingAddress.phone,
            address_line1: params.shippingAddress.addressLine1,
            address_line2: params.shippingAddress.addressLine2 ?? null,
            landmark: params.shippingAddress.landmark ?? null,
            city: params.shippingAddress.city,
            state: params.shippingAddress.state,
            pincode: params.shippingAddress.pincode || "",
            country: params.shippingAddress.country || "India",
            latitude: params.shippingAddress.latitude ?? null,
            longitude: params.shippingAddress.longitude ?? null,
            is_active: true,
            created_by: params.userId,
            updated_by: params.userId,
          },
          {
            uuid: crypto.randomUUID(),
            orderId: createdOrder.id,
            type: "billing",
            full_name: params.billingAddress.fullName,
            phone: params.billingAddress.phone,
            address_line1: params.billingAddress.addressLine1,
            address_line2: params.billingAddress.addressLine2 ?? null,
            landmark: params.billingAddress.landmark ?? null,
            city: params.billingAddress.city,
            state: params.billingAddress.state,
            pincode: params.billingAddress.pincode || "",
            country: params.billingAddress.country || "India",
            latitude: params.billingAddress.latitude ?? null,
            longitude: params.billingAddress.longitude ?? null,
            is_active: true,
            created_by: params.userId,
            updated_by: params.userId,
          },
        ],
      });

      // 3. Create Order Items
      await tx.orderItem.createMany({
        data: params.items.map((item) => ({
          uuid: crypto.randomUUID(),
          orderId: createdOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          product_name_snapshot: item.productName,
          variant_snapshot: item.variantName,
          sku_snapshot: item.sku,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_amount: item.taxAmount,
          total_price: item.totalPrice,
          is_active: true,
          created_by: params.userId,
          updated_by: params.userId,
        })),
      });

      // 4. Create Status History
      await tx.order_status_history.create({
        data: {
          order_id: createdOrder.id,
          status: "pending",
          note: params.notes || "Order placed by customer",
          changed_by: params.userId,
          is_active: true,
          created_by: params.userId,
          updated_by: params.userId,
        },
      });

      // 5. Convert Cart & Deactivate Items
      await tx.cart.update({
        where: { id: params.cartId },
        data: {
          status: "converted",
          last_activity_at: now,
          updatedAt: now,
          updated_by: params.userId,
        },
      });

      await tx.cartItem.updateMany({
        where: {
          cartId: params.cartId,
          is_active: true,
        },
        data: {
          is_active: false,
          updatedAt: now,
          updated_by: params.userId,
        },
      });

      // 6. Fetch created full order
      const fullOrder = await tx.order.findUniqueOrThrow({
        where: { id: createdOrder.id },
        include: orderDetailInclude,
      });

      return formatOrderDetail(fullOrder);
    });
  },

  async findCustomerOrders(
    userId: bigint,
    params: CustomerOrdersQueryInput
  ): Promise<OrderListResponse<OrderListItemResponse>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.OrderWhereInput = {
      userId,
      is_active: true,
    };

    if (params.status) {
      where.order_status = params.status;
    }

    if (params.search) {
      where.orderNumber = { contains: params.search };
    }

    const sortOrder = params.sortOrder ?? "desc";
    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: sortOrder };

    if (params.sortBy === "orderNumber") {
      orderBy = { orderNumber: sortOrder };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else if (params.sortBy === "updatedAt") {
      orderBy = { updatedAt: sortOrder };
    } else if (params.sortBy === "placedAt") {
      orderBy = { placed_at: sortOrder };
    } else if (params.sortBy === "totalAmount") {
      orderBy = { totalAmount: sortOrder };
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              cust_id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            where: { is_active: true },
            select: { quantity: true },
          },
        },
      }),
      db.order.count({ where }),
    ]);

    return {
      data: orders.map(formatOrderListItem),
      meta: {
        page,
        limit: pageSize,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async findCustomerOrderByUuid(
    userId: bigint,
    uuid: string
  ): Promise<OrderDetailResponse | null> {
    const order = await db.order.findFirst({
      where: {
        uuid,
        userId,
        is_active: true,
      },
      include: orderDetailInclude,
    });

    return order ? formatOrderDetail(order) : null;
  },

  async findAdminOrders(
    params: AdminOrdersListInput
  ): Promise<OrderListResponse<OrderListItemResponse>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.OrderWhereInput = {
      is_active: true,
    };

    if (params.customerId) {
      where.user = { uuid: params.customerId };
    }

    if (params.status) {
      where.order_status = params.status;
    }

    if (params.paymentStatus) {
      where.payment_status = params.paymentStatus;
    }

    if (params.search) {
      const s = params.search;
      where.OR = [
        { orderNumber: { contains: s } },
        { user: { name: { contains: s } } },
        { user: { email: { contains: s } } },
        { user: { phone: { contains: s } } },
        { user: { cust_id: { contains: s } } },
      ];
    }

    const sortOrder = params.sortOrder ?? "desc";
    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: sortOrder };

    if (params.sortBy === "orderNumber") {
      orderBy = { orderNumber: sortOrder };
    } else if (params.sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else if (params.sortBy === "updatedAt") {
      orderBy = { updatedAt: sortOrder };
    } else if (params.sortBy === "placedAt") {
      orderBy = { placed_at: sortOrder };
    } else if (params.sortBy === "totalAmount") {
      orderBy = { totalAmount: sortOrder };
    } else if (params.sortBy === "orderStatus") {
      orderBy = { order_status: sortOrder };
    } else if (params.sortBy === "paymentStatus") {
      orderBy = { payment_status: sortOrder };
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              cust_id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            where: { is_active: true },
            select: { quantity: true },
          },
          shipments: {
            where: { is_active: true },
            orderBy: { id: "desc" },
            take: 1,
            include: {
              delivery_staff: {
                select: {
                  id: true,
                  uuid: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      db.order.count({ where }),
    ]);

    return {
      data: orders.map(formatOrderListItem),
      meta: {
        page,
        limit: pageSize,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async findAdminOrderByUuid(uuid: string): Promise<OrderDetailResponse | null> {
    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
      include: orderDetailInclude,
    });

    return order ? formatOrderDetail(order) : null;
  },

  async cancelOrderTransaction(params: {
    orderId: bigint;
    note?: string;
    changedBy: bigint;
  }): Promise<OrderDetailResponse> {
    return db.$transaction(async (tx) => {
      const now = new Date();

      await tx.order.update({
        where: { id: params.orderId },
        data: {
          order_status: "cancelled",
          updatedAt: now,
          updated_by: params.changedBy,
        },
      });

      await tx.order_status_history.create({
        data: {
          order_id: params.orderId,
          status: "cancelled",
          note: params.note || "Order cancelled",
          changed_by: params.changedBy,
          is_active: true,
          created_by: params.changedBy,
          updated_by: params.changedBy,
        },
      });

      const updated = await tx.order.findUniqueOrThrow({
        where: { id: params.orderId },
        include: orderDetailInclude,
      });

      return formatOrderDetail(updated);
    });
  },

  async returnOrderTransaction(params: {
    orderId: bigint;
    note?: string;
    changedBy: bigint;
  }): Promise<OrderDetailResponse> {
    return db.$transaction(async (tx) => {
      const now = new Date();

      await tx.order.update({
        where: { id: params.orderId },
        data: {
          order_status: "returned",
          updatedAt: now,
          updated_by: params.changedBy,
        },
      });

      await tx.order_status_history.create({
        data: {
          order_id: params.orderId,
          status: "returned",
          note: params.note || "Order returned",
          changed_by: params.changedBy,
          is_active: true,
          created_by: params.changedBy,
          updated_by: params.changedBy,
        },
      });

      const updated = await tx.order.findUniqueOrThrow({
        where: { id: params.orderId },
        include: orderDetailInclude,
      });

      return formatOrderDetail(updated);
    });
  },

  async updateOrderStatusWithHistory(params: {
    orderId: bigint;
    status: string;
    note?: string;
    changedBy: bigint;
  }): Promise<OrderDetailResponse> {
    return db.$transaction(async (tx) => {
      const now = new Date();

      await tx.order.update({
        where: { id: params.orderId },
        data: {
          order_status: params.status as any,
          updatedAt: now,
          updated_by: params.changedBy,
        },
      });

      await tx.order_status_history.create({
        data: {
          order_id: params.orderId,
          status: params.status,
          note: params.note || null,
          changed_by: params.changedBy,
          is_active: true,
          created_by: params.changedBy,
          updated_by: params.changedBy,
        },
      });

      const updated = await tx.order.findUniqueOrThrow({
        where: { id: params.orderId },
        include: orderDetailInclude,
      });

      return formatOrderDetail(updated);
    });
  },
};
