import { z } from "zod";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  DELIVERY_METHODS,
} from "../types";

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().max(255).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
});

export type GetOrdersQueryInput = z.infer<typeof getOrdersQuerySchema>;

export const placeOrderSchema = z.object({
  addressId: z.number().int().positive("Address is required"),
  deliveryMethod: z.enum(DELIVERY_METHODS).optional().default("STANDARD"),
  couponCode: z.string().trim().max(50).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    message: "Payment method is required",
  }),
  notes: z.string().max(500).optional(),
});

export type PlaceOrderSchemaInput = z.infer<typeof placeOrderSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CancelOrderSchemaInput = z.infer<typeof cancelOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type UpdateOrderStatusSchemaInput = z.infer<typeof updateOrderStatusSchema>;

export const checkoutSummarySchema = z.object({
  deliveryMethod: z.enum(DELIVERY_METHODS).optional().default("STANDARD"),
  couponCode: z.string().trim().max(50).optional(),
});

export type CheckoutSummarySchemaInput = z.infer<typeof checkoutSummarySchema>;
