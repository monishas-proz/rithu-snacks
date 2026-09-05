import type { VariantMeasurement } from "@/features/variants/utils/measurement.util";

export interface CustomerBrandDto {
  id: string; // Brand UUID
  name: string;
  image: string | null;
}

export interface CustomerCategoryDto {
  id: string; // Category UUID
  name: string;
  image: string | null;
}

export interface CustomerProductListItemDto {
  id: string; // Product UUID
  name: string;
  description: string | null;
  brand: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  image: string | null;
  minPrice: number;
  maxPrice: number;
}

/**
 * A single sellable pack size ("250g", "500g", "1kg", ...) for a variant/item.
 * Selling price is NOT stored - it is basePrice minus any active offer/discount,
 * computed at read time (see computeSellingPrice in the catalog repository). No
 * offer engine is wired up for the storefront yet, so sellingPrice currently
 * mirrors basePrice.
 */
export interface CustomerVariantUnitPriceDto {
  id: string; // VariantUnitPrice UUID - this is what cart/wishlist APIs key off
  sku: string;
  measurement: VariantMeasurement;
  basePrice: number;
  sellingPrice: number;
  isDefault: boolean;
}

export interface CustomerVariantListItemDto {
  id: string; // Variant UUID
  productId: string; // Product UUID
  productName: string;
  variantName: string;
  measurement: VariantMeasurement;
  sku: string;
  basePrice: number;
  salePrice: number;
  primaryImage: string | null;
  outOfStock?: boolean;
  ingredients: string | null;
  isReadyToMix: boolean;
  cookingRecipe: string | null;
  shelfLife: string | null;
  // Full list of sellable pack sizes for this item - an item can have any
  // number of pack sizes, each independently priced. `sku`/`basePrice`/
  // `salePrice`/`measurement` above mirror the default (or first) entry here
  // for backward compatibility with callers that expect a single price/sku.
  unitPrices: CustomerVariantUnitPriceDto[];
}

export interface CustomerVariantImageDto {
  id: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CustomerVariantDetailDto extends CustomerVariantListItemDto {
  images: CustomerVariantImageDto[];
}

export interface CustomerProductDetailDto {
  id: string; // Product UUID
  name: string;
  description: string | null;
  brand: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  image: string | null;
  variants: CustomerVariantListItemDto[];
}
