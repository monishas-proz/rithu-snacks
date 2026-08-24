import { z } from "zod";

export const ORDER_STATUS_ENUM = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

export const PAYMENT_STATUS_ENUM = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partial_refund",
] as const;

export const customerCreateOrderSchema = z
  .object({
    addressId: z.string().uuid("Invalid addressId UUID format"),
    billingAddressId: z.string().uuid("Invalid billingAddressId UUID format").optional(),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  })
  .strict();

export type CustomerCreateOrderInput = z.infer<typeof customerCreateOrderSchema>;

export const adminCreateOrderItemSchema = z
  .object({
    variantId: z.string().uuid("Invalid variantId UUID format"),
    quantity: z
      .number()
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1"),
  })
  .strict();

export const adminCreateOrderSchema = z
  .object({
    customerId: z.string().uuid("Invalid customerId UUID format"),
    addressId: z.string().uuid("Invalid addressId UUID format"),
    billingAddressId: z.string().uuid("Invalid billingAddressId UUID format").optional(),
    items: z
      .array(adminCreateOrderItemSchema)
      .min(1, "At least one item is required in the order"),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  })
  .strict();

export type AdminCreateOrderInput = z.infer<typeof adminCreateOrderSchema>;

export const customerOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "page must be at least 1").default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, "pageSize must be at least 1")
    .max(100, "pageSize cannot exceed 100")
    .default(20),
  search: z.string().trim().optional(),
  status: z.enum(ORDER_STATUS_ENUM).optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "placedAt", "totalAmount", "orderNumber"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomerOrdersQueryInput = z.infer<typeof customerOrdersQuerySchema>;

export const adminOrdersListSchema = z
  .object({
    page: z.number().int().min(1, "page must be at least 1").default(1),
    pageSize: z
      .number()
      .int()
      .min(1, "pageSize must be at least 1")
      .max(100, "pageSize cannot exceed 100")
      .default(20),
    search: z.string().trim().optional(),
    customerId: z.string().uuid("Invalid customerId UUID format").optional(),
    status: z.enum(ORDER_STATUS_ENUM).optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_ENUM).optional(),
    sortBy: z
      .enum([
        "orderNumber",
        "createdAt",
        "updatedAt",
        "placedAt",
        "totalAmount",
        "orderStatus",
        "paymentStatus",
      ])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type AdminOrdersListInput = z.infer<typeof adminOrdersListSchema>;

export const cancelOrderSchema = z
  .object({
    note: z.string().max(255, "Note cannot exceed 255 characters").optional(),
  })
  .strict();

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const returnOrderSchema = z
  .object({
    note: z.string().max(255, "Note cannot exceed 255 characters").optional(),
  })
  .strict();

export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;

export const orderStatusTransitionSchema = z
  .object({
    note: z
      .string()
      .trim()
      .min(1, "Note cannot be empty")
      .max(255, "Note cannot exceed 255 characters")
      .optional(),
  })
  .strict();

export type OrderStatusTransitionInput = z.infer<
  typeof orderStatusTransitionSchema
>;
