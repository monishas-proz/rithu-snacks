import type { PaginationMeta } from "@/lib/api/api-response";
import type { VariantMeasurement } from "../utils/measurement.util";

export * from "../utils/measurement.util";
export type {
  CustomerVariantListItemDto,
  CustomerVariantDetailDto,
  CustomerVariantImageDto,
} from "@/features/customers/types";

export interface CustomerGlobalVariantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  productIds?: string[];
  brandIds?: string[];
  categoryIds?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?:
    | "variantName"
    | "salePrice"
    | "basePrice"
    | "createdAt"
    | "productName";
  sortOrder?: "asc" | "desc";
}

export interface UnitOption {
  id: string;
  name: string;
  code: string;
  type: "weight" | "volume" | "count";
  conversionFactor?: number;
  baseUnitId?: string | null;
}

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
  unitId?: string;
  unitValue?: number;
  weightGrams?: number | null;
  unitName?: string;
  unitCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAdminVariantsResult {
  data: AdminVariantResponse[];
  meta?: PaginationMeta;
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

export interface AdminVariantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  productId?: string;
  productUuid?: string;
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

export interface VariantPriceHistoryChangedByDto {
  id: string; // user uuid
  name: string;
}

export interface VariantPriceHistoryResponse {
  id: string; // history uuid
  oldBasePrice: number | null;
  newBasePrice: number | null;
  oldSalePrice: number | null;
  newSalePrice: number | null;
  changedAt: Date;
  changedBy: VariantPriceHistoryChangedByDto | null;
}

export interface GetVariantPriceHistoryParams {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  sortOrder?: "asc" | "desc";
}