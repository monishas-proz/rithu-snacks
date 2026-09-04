import type { VariantMeasurement } from "@/features/variants/utils/measurement.util";

export type { VariantMeasurement };

export interface CartItemResponse {
  id: string; // Public Cart Item UUID
  productId: string; // Public Product UUID
  variantId: string; // Public Variant UUID (item-level)
  variantUnitPriceId: string; // Public Variant Unit Price UUID (pack size)
  productName: string;
  variantName: string;
  measurement: VariantMeasurement;
  primaryImage: string | null;
  quantity: number;
  priceAtAdd: number;
  currentPrice: number;
  priceChanged: boolean;
  itemTotal: number;
}

export interface CartResponse {
  id: string | null; // Public Cart UUID
  items: CartItemResponse[];
  subtotal: number;
  totalItems: number;
}

export interface CartCountResponse {
  count: number;
  totalQuantity: number;
}

