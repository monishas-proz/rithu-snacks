export interface AdminVariantResponse {
  id: string; // Public Variant UUID
  productId: string; // Public Product UUID
  productName: string;
  variantName: string; // Stored DB variant_name e.g. "1 kg"
  sku: string;
  unitValue: number;
  unitId: string; // Public Unit UUID
  unitName: string;
  unitCode: string;
  basePrice: number;
  salePrice: number;
  weightGrams: number | null;
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
