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
