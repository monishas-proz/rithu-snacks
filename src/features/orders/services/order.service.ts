import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { orderRepository } from "../repositories/order.repository";
import type {
  OrderDetailResponse,
  OrderListItemResponse,
  OrderListResponse,
  OrderStatusTransitionResponse,
} from "../types";
import type {
  CustomerCreateOrderInput,
  AdminCreateOrderInput,
  CustomerOrdersQueryInput,
  AdminOrdersListInput,
  CancelOrderInput,
  ReturnOrderInput,
  OrderStatusTransitionInput,
} from "../validations/order.schema";
import type { orders_order_status } from "@/generated/prisma";

export const orderService = {
  async createCustomerOrder(
    sessionUserId: string,
    input: CustomerCreateOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const userId = user.internalId;

    // 1. Find active cart with active cart items
    const cart = await db.cart.findFirst({
      where: {
        userId,
        status: "active",
        is_active: true,
      },
      include: {
        items: {
          where: {
            is_active: true,
          },
          include: {
            product: true,
            variant: {
              include: {
                product_units: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest("Cart is empty or no active cart found");
    }

    // 2. Validate every cart item's product and variant
    const orderItemsData: Array<{
      productId: bigint;
      variantId: bigint;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      taxAmount: number;
      totalPrice: number;
    }> = [];

    let subtotal = 0;

    for (const item of cart.items) {
      if (
        !item.product ||
        !item.product.isActive ||
        item.product.deleted_at !== null ||
        !item.variant ||
        !item.variant.isActive ||
        item.variant.deleted_at !== null
      ) {
        throw ApiError.badRequest(
          `Product variant "${item.variant?.variant_name || item.product?.name || "item"}" is no longer available`
        );
      }

      const unitPrice =
        item.variant.sale_price !== null && Number(item.variant.sale_price) > 0
          ? Number(item.variant.sale_price)
          : Number(item.variant.base_price);

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant.variant_name,
        sku: item.variant.sku,
        quantity: item.quantity,
        unitPrice,
        taxAmount: 0,
        totalPrice,
      });
    }

    // 3. Validate shipping address
    const shippingAddress = await db.customerAddress.findFirst({
      where: {
        uuid: input.addressId,
        userId,
        is_active: true,
      },
    });

    if (!shippingAddress) {
      throw ApiError.badRequest(
        "Shipping address not found or does not belong to customer"
      );
    }

    // 4. Validate billing address if provided
    let billingAddress = shippingAddress;
    if (input.billingAddressId && input.billingAddressId !== input.addressId) {
      const foundBilling = await db.customerAddress.findFirst({
        where: {
          uuid: input.billingAddressId,
          userId,
          is_active: true,
        },
      });

      if (!foundBilling) {
        throw ApiError.badRequest(
          "Billing address not found or does not belong to customer"
        );
      }
      billingAddress = foundBilling;
    }

    const totalAmount = subtotal;

    // 5. Execute creation transaction
    return orderRepository.createCustomerOrderTransaction({
      userId,
      cartId: cart.id,
      subtotal,
      totalAmount,
      notes: input.notes,
      shippingAddress: {
        fullName: shippingAddress.full_name,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.address_line1,
        addressLine2: shippingAddress.address_line2,
        landmark: shippingAddress.landmark,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode ?? "",
        country: shippingAddress.country ?? "India",
        latitude: shippingAddress.latitude ? Number(shippingAddress.latitude) : null,
        longitude: shippingAddress.longitude ? Number(shippingAddress.longitude) : null,
      },
      billingAddress: {
        fullName: billingAddress.full_name,
        phone: billingAddress.phone,
        addressLine1: billingAddress.address_line1,
        addressLine2: billingAddress.address_line2,
        landmark: billingAddress.landmark,
        city: billingAddress.city,
        state: billingAddress.state,
        pincode: billingAddress.pincode ?? "",
        country: billingAddress.country ?? "India",
        latitude: billingAddress.latitude ? Number(billingAddress.latitude) : null,
        longitude: billingAddress.longitude ? Number(billingAddress.longitude) : null,
      },
      items: orderItemsData,
    });
  },

  async createAdminOrder(
    adminSessionUserId: string,
    input: AdminCreateOrderInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Admin user not found");
    }

    // 1. Validate Customer
    const customer = await db.user.findFirst({
      where: {
        uuid: input.customerId,
        deleted_at: null,
        role: {
          slug: "customer",
        },
      },
    });

    if (!customer) {
      throw ApiError.badRequest("Customer not found or invalid customer account");
    }

    // 2. Validate Shipping Address
    const shippingAddress = await db.customerAddress.findFirst({
      where: {
        uuid: input.addressId,
        userId: customer.id,
        is_active: true,
      },
    });

    if (!shippingAddress) {
      throw ApiError.badRequest(
        "Shipping address not found or does not belong to customer"
      );
    }

    // 3. Validate Billing Address
    let billingAddress = shippingAddress;
    if (input.billingAddressId && input.billingAddressId !== input.addressId) {
      const foundBilling = await db.customerAddress.findFirst({
        where: {
          uuid: input.billingAddressId,
          userId: customer.id,
          is_active: true,
        },
      });

      if (!foundBilling) {
        throw ApiError.badRequest(
          "Billing address not found or does not belong to customer"
        );
      }
      billingAddress = foundBilling;
    }

    // 4. Validate variants and products
    const orderItemsData: Array<{
      productId: bigint;
      variantId: bigint;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      taxAmount: number;
      totalPrice: number;
    }> = [];

    let subtotal = 0;

    for (const item of input.items) {
      const variant = await db.productVariant.findFirst({
        where: {
          uuid: item.variantId,
          isActive: true,
          deleted_at: null,
          product: {
            isActive: true,
            deleted_at: null,
          },
        },
        include: {
          product: true,
          product_units: true,
        },
      });

      if (!variant) {
        throw ApiError.badRequest(
          `Product variant ${item.variantId} is unavailable`
        );
      }

      const unitPrice =
        variant.sale_price !== null && Number(variant.sale_price) > 0
          ? Number(variant.sale_price)
          : Number(variant.base_price);

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItemsData.push({
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.name,
        variantName: variant.variant_name,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice,
        taxAmount: 0,
        totalPrice,
      });
    }

    const totalAmount = subtotal;

    // 5. Execute creation transaction
    return orderRepository.createAdminOrderTransaction({
      adminUserId: adminUser.internalId,
      customerUserId: customer.id,
      subtotal,
      totalAmount,
      notes: input.notes,
      shippingAddress: {
        fullName: shippingAddress.full_name,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.address_line1,
        addressLine2: shippingAddress.address_line2,
        landmark: shippingAddress.landmark,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode ?? "",
        country: shippingAddress.country ?? "India",
        latitude: shippingAddress.latitude ? Number(shippingAddress.latitude) : null,
        longitude: shippingAddress.longitude ? Number(shippingAddress.longitude) : null,
      },
      billingAddress: {
        fullName: billingAddress.full_name,
        phone: billingAddress.phone,
        addressLine1: billingAddress.address_line1,
        addressLine2: billingAddress.address_line2,
        landmark: billingAddress.landmark,
        city: billingAddress.city,
        state: billingAddress.state,
        pincode: billingAddress.pincode ?? "",
        country: billingAddress.country ?? "India",
        latitude: billingAddress.latitude ? Number(billingAddress.latitude) : null,
        longitude: billingAddress.longitude ? Number(billingAddress.longitude) : null,
      },
      items: orderItemsData,
    });
  },

  async getCustomerOrders(
    sessionUserId: string,
    query: CustomerOrdersQueryInput
  ): Promise<OrderListResponse<OrderListItemResponse>> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    return orderRepository.findCustomerOrders(user.internalId, query);
  },

  async getCustomerOrderByUuid(
    sessionUserId: string,
    uuid: string
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const order = await orderRepository.findCustomerOrderByUuid(
      user.internalId,
      uuid
    );

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    return order;
  },

  async getAdminOrders(
    query: AdminOrdersListInput
  ): Promise<OrderListResponse<OrderListItemResponse>> {
    return orderRepository.findAdminOrders(query);
  },

  async getAdminOrderByUuid(uuid: string): Promise<OrderDetailResponse> {
    const order = await orderRepository.findAdminOrderByUuid(uuid);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }
    return order;
  },

  async cancelCustomerOrder(
    sessionUserId: string,
    uuid: string,
    input?: CancelOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        userId: user.internalId,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Cancellation window: pending, confirmed, processing
    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.order_status)) {
      throw ApiError.badRequest(
        `Order cannot be cancelled in '${order.order_status}' status`
      );
    }

    return orderRepository.cancelOrderTransaction({
      orderId: order.id,
      note: input?.note || "Cancelled by customer",
      changedBy: user.internalId,
    });
  },

  async cancelAdminOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: CancelOrderInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Admin user not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (
      order.order_status === "delivered" ||
      order.order_status === "returned" ||
      order.order_status === "cancelled"
    ) {
      throw ApiError.badRequest(
        `Cannot cancel an order that is already '${order.order_status}'`
      );
    }

    return orderRepository.cancelOrderTransaction({
      orderId: order.id,
      note: input?.note || "Cancelled by admin",
      changedBy: adminUser.internalId,
    });
  },

  async returnCustomerOrder(
    sessionUserId: string,
    uuid: string,
    input?: ReturnOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        userId: user.internalId,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== "delivered") {
      throw ApiError.badRequest("Only delivered orders can be returned");
    }

    return orderRepository.returnOrderTransaction({
      orderId: order.id,
      note: input?.note || "Return requested by customer",
      changedBy: user.internalId,
    });
  },

  async returnAdminOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: ReturnOrderInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Admin user not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== "delivered") {
      throw ApiError.badRequest("Only delivered orders can be returned");
    }

    return orderRepository.returnOrderTransaction({
      orderId: order.id,
      note: input?.note || "Return processed by admin",
      changedBy: adminUser.internalId,
    });
  },

  async transitionOrderStatus(
    adminSessionUserId: string,
    uuid: string,
    expectedCurrentStatus: orders_order_status,
    newStatus: orders_order_status,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Admin user not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== expectedCurrentStatus) {
      throw ApiError.badRequest(
        `Order status is '${order.order_status}'. Only '${expectedCurrentStatus}' orders can be transitioned to '${newStatus}'.`
      );
    }

    const updated = await orderRepository.updateOrderStatusWithHistory({
      orderId: order.id,
      status: newStatus,
      note: input?.note,
      changedBy: adminUser.internalId,
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  },

  async confirmOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "pending",
      "confirmed",
      input
    );
  },

  async startProcessingOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "confirmed",
      "processing",
      input
    );
  },

  async markOrderAsPacked(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "processing",
      "packed",
      input
    );
  },
};
