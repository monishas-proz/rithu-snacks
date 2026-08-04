export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  discountPercent: number;
  isActive: boolean;
  isDigital: boolean;
  stockQuantity: number;
  images: { id: number; url: string; altText: string | null }[];
  category: { id: number; name: string; slug: string } | null;
}

export interface CartVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface CartItemWithProduct {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  product: CartProduct;
  variant: CartVariant | null;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  shippingCharge: number;
  grandTotal: number;
  totalItems: number;
}

export interface CartWithItems {
  id: number;
  userId: number | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: CartItemWithProduct[];
  summary: CartSummary;
}

export interface AddToCartInput {
  productId: number;
  variantId?: number;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CartItemIdentifier {
  itemId: number;
  userId: number;
}
