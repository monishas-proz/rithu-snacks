import type { VariantMeasurement } from "../utils/measurement.util";

export * from "../utils/measurement.util";

export interface AdminVariantResponse {
  id: string; // Public Variant UUID
  productId: string; // Public Product UUID
  productName: string;
  variantName: string; // Stored DB variant_name e.g. "1 kg"
  measurement: VariantMeasurement;
  sku: string;
  basePrice: number;
  salePrice: number;
  primaryImage: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminVariantImageResponse {
  id: string; // Public Variant Image UUID
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
  status: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAdminVariantsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  productId?: string;
  productUuid?: string;
}

export interface AdminVariantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  productIds?: string[];
  brandIds?: string[];
  categoryIds?: string[];
  measurementTypes?: Array<"weight" | "volume" | "count">;
  unitIds?: string[];
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?:
    | "variantName"
    | "productName"
    | "sku"
    | "basePrice"
    | "salePrice"
    | "createdAt"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
}
