export interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  discountPercent: number;
  isActive: boolean;
  isFeatured: boolean;
  images: { id: number; url: string; altText: string | null }[];
  category: { id: number; name: string; slug: string } | null;
  brand: { id: number; name: string; slug: string } | null;
}

export interface WishlistItemWithProduct {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  product: WishlistProduct;
}

export interface GetWishlistResult {
  items: WishlistItemWithProduct[];
  count: number;
}

export interface AddToWishlistInput {
  productId: number;
}

export interface WishlistStatusResult {
  isInWishlist: boolean;
  wishlistItemId: number | null;
}
