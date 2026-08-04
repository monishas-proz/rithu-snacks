import { db } from "@/lib/db/prisma";
import {
  Prisma,
  OrderStatus as DBOrderStatus,
  PaymentStatus as DBPaymentStatus,
} from "@/generated/prisma";
import type { GetOrdersParams, OrderStatus } from "../types";

const listItemSelect = {
  id: true,
  productId: true,
  product: {
    select: {
      name: true,
      slug: true,
      sku: true,
      images: { take: 1, orderBy: { isPrimary: "desc" } },
    },
  },
  variant: { select: { name: true, sku: true } },
  quantity: true,
  price: true,
  total: true,
} satisfies Prisma.OrderItemSelect;

const detailInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          images: { take: 1, orderBy: { isPrimary: "desc" } },
        },
      },
      variant: { select: { id: true, name: true, sku: true } },
    },
  },
  address: true,
  payments: true,
  delivery: true,
  shipping: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

function buildAdminWhere(params: GetOrdersParams): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (params.status) {
    where.status = params.status as DBOrderStatus;
  }

  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search } },
      { user: { name: { contains: params.search } } },
      { user: { email: { contains: params.search } } },
      {
        items: {
          some: { product: { name: { contains: params.search } } },
        },
      },
    ];
  }

  return where;
}

export const orderRepository = {
  async findAllForCustomer(userId: number, params: GetOrdersParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const where: Prisma.OrderWhereInput = { userId };

    if (params.status) {
      where.status = params.status as DBOrderStatus;
    }

    const [data, total] = await Promise.all([
      db.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          taxAmount: true,
          shippingAmount: true,
          discountAmount: true,
          totalAmount: true,
          couponId: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              total: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { take: 1, orderBy: { isPrimary: "desc" } },
                },
              },
              variant: { select: { name: true, sku: true } },
            },
          },
          payments: { take: 1 },
          delivery: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return {
      data,
      total,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findByIdForCustomer(userId: number, id: number) {
    return db.order.findFirst({
      where: { id, userId },
      include: detailInclude,
    });
  },

  async findById(id: number) {
    return db.order.findUnique({
      where: { id },
      include: detailInclude,
    });
  },

  async findByOrderNumber(orderNumber: string) {
    return db.order.findUnique({
      where: { orderNumber },
      include: detailInclude,
    });
  },

  async findAll(params: GetOrdersParams = {}) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where = buildAdminWhere(params);

    const [data, total] = await Promise.all([
      db.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          taxAmount: true,
          shippingAmount: true,
          discountAmount: true,
          totalAmount: true,
          couponId: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              total: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { take: 1, orderBy: { isPrimary: "desc" } },
                },
              },
              variant: { select: { name: true, sku: true } },
            },
          },
          payments: { take: 1 },
          delivery: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return {
      data,
      total,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async updateStatus(id: number, status: OrderStatus) {
    return db.order.update({
      where: { id },
      data: { status },
      include: detailInclude,
    });
  },

  async updatePaymentStatus(orderId: number, status: string) {
    return db.payment.updateMany({
      where: { orderId },
      data: { status: status as DBPaymentStatus },
    });
  },
};
