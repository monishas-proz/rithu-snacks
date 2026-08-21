import type { VariantMeasurement } from "../utils/measurement.util";

export * from "../utils/measurement.util";

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

export interface GetAdminVariantsResult {
  data: AdminVariantResponse[];
  meta?: {
    page: number;
    limit: number;
    pageSize?: number;
    total: number;
    totalPages: number;
  };
}
