type QueryKeyFactory = {
  all: readonly string[];
  lists: () => readonly string[];
  list: (filters?: Record<string, unknown>) => readonly unknown[];
  details: () => readonly string[];
  detail: (id: string | number) => readonly unknown[];
};

function createQueryKeyFactory(base: string): QueryKeyFactory {
  return {
    all: [base] as const,
    lists: () => [base, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      filters
        ? ([base, "list", filters] as const)
        : ([base, "list"] as const),
    details: () => [base, "detail"] as const,
    detail: (id: string | number) => [base, "detail", id] as const,
  };
}

export const productKeys = createQueryKeyFactory("products");
export const gstRateKeys = createQueryKeyFactory("gst-rates");
export const hsnCodeKeys = createQueryKeyFactory("hsn-codes");
export const categoryKeys = createQueryKeyFactory("categories");
export const brandKeys = createQueryKeyFactory("brands");
export const unitKeys = createQueryKeyFactory("units");
export const cartKeys = createQueryKeyFactory("cart");
export const wishlistKeys = createQueryKeyFactory("wishlist");
export const orderKeys = createQueryKeyFactory("orders");
export const reviewKeys = createQueryKeyFactory("reviews");
export const blogKeys = createQueryKeyFactory("blogs");
export const couponKeys = createQueryKeyFactory("coupons");
export const userKeys = createQueryKeyFactory("users");
export const addressKeys = createQueryKeyFactory("addresses");
export const adminOrderKeys = createQueryKeyFactory("admin-orders");
export const checkoutKeys = createQueryKeyFactory("checkout");
export const roleKeys = createQueryKeyFactory("roles");
export const permissionKeys = createQueryKeyFactory("permissions");
