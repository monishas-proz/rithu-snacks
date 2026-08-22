import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { variantRepository } from "../repositories/variant.repository";
import { productRepository } from "@/features/products/repositories/product.repository";
import { unitRepository } from "@/features/units/repositories/unit.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import { formatVariantMeasurement } from "../utils/measurement.util";
import type { Prisma } from "@/generated/prisma";
import type {
  AdminVariantResponse,
  GetAdminVariantsParams,
  AdminVariantListParams,
} from "../types";
import type {
  CreateAdminVariantInput,
  UpdateAdminVariantInput,
} from "../validations/admin-variant.schema";

function formatAdminVariantResponse(
  variant: {
    id: bigint;
    uuid: string;
    productId: bigint;
    variant_name?: string | null;
    sku: string;
    unit_value: Prisma.Decimal | number;
    unit_id: bigint;
    base_price: Prisma.Decimal | number;
    sale_price: Prisma.Decimal | number;
    weight_grams?: Prisma.Decimal | number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    product?: { uuid: string | null; name: string } | null;
    product_units?: { uuid: string | null; name: string; code: string; type?: string | null } | null;
    product_variant_images?: Array<{ image_url: string; is_primary: boolean }> | null;
  },
  cachedProductUuid?: string,
  cachedUnitUuid?: string,
  cachedProductName?: string,
  cachedUnitName?: string,
  cachedUnitCode?: string,
  cachedUnitType?: string
): AdminVariantResponse {
  const variantUuid = variant.uuid;
  const productUuid = cachedProductUuid ?? variant.product?.uuid ?? String(variant.productId);

  const productName = cachedProductName || variant.product?.name || "";
  const variantName = variant.variant_name || "";
  const unitCode = cachedUnitCode || variant.product_units?.code || "";
  const unitType = cachedUnitType || (variant.product_units as any)?.type || "";

  const primaryImgObj =
    variant.product_variant_images?.find((img) => img.is_primary) ??
    variant.product_variant_images?.[0];
  const primaryImage = primaryImgObj ? primaryImgObj.image_url : null;

  const measurement = formatVariantMeasurement(
    { type: unitType, code: unitCode },
    variant.unit_value
  );

  return {
    id: variantUuid,
    productId: productUuid,
    productName,
    variantName,
    measurement,
    sku: variant.sku,
    basePrice: Number(variant.base_price),
    salePrice: variant.sale_price !== null && Number(variant.sale_price) > 0 ? Number(variant.sale_price) : Number(variant.base_price),
    primaryImage,
    isActive: Boolean(variant.isActive),
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const variantService = {
  async createAdminVariant(
    productUuid: string,
    data: CreateAdminVariantInput,
    adminEmail?: string
  ): Promise<AdminVariantResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    // 1. Resolve & Validate Product
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    // 2. Resolve & Validate Unit
    const unit = await unitRepository.findByUuid(data.unitId);
    if (!unit || !unit.is_active) {
      throw ApiError.badRequest("Invalid or inactive unit");
    }

    // 3. Check duplicate SKU among active variants
    const existingSku = await variantRepository.findBySku(data.sku);
    if (existingSku) {
      throw ApiError.conflict(`An active variant with SKU '${data.sku}' already exists`);
    }

    const created = await variantRepository.create({
      uuid: crypto.randomUUID(),
      productId: product.id,
      variant_name: data.variantName,
      sku: data.sku,
      unit_value: data.unitValue,
      unit_id: unit.id,
      base_price: data.basePrice,
      sale_price: data.salePrice,
      weight_grams: data.weightGrams ?? null,
      is_default: false,
      isActive: true,
      created_by: adminId,
      updated_by: adminId,
    });

    return formatAdminVariantResponse(
      created,
      product.uuid || productUuid,
      unit.uuid || data.unitId,
      product.name,
      unit.name,
      unit.code,
      unit.type
    );
  },

  async getAllAdminVariants(params: AdminVariantListParams = {}) {
    const result = await variantRepository.findAdminVariants(params);
    const data = result.data.map((item) => formatAdminVariantResponse(item));

    return {
      data,
      meta: result.meta,
    };
  },

  async getAdminVariants(
    productUuid: string,
    params: GetAdminVariantsParams = {}
  ) {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const result = await variantRepository.findAdminAllByProductId(product.id, params);
    const data = result.data.map((item) =>
      formatAdminVariantResponse(item, product.uuid || productUuid, undefined, product.name)
    );

    return {
      data,
      meta: result.meta,
    };
  },

  async getAdminVariantByUuid(
    productUuid: string,
    variantUuid: string
  ): Promise<AdminVariantResponse> {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.productId !== product.id) {
      throw ApiError.notFound("Variant not found for this product");
    }

    return formatAdminVariantResponse(variant, product.uuid || productUuid, undefined, product.name);
  },

  async updateAdminVariant(
    productUuid: string,
    variantUuid: string,
    data: UpdateAdminVariantInput,
    adminEmail?: string
  ): Promise<AdminVariantResponse> {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const existing = await variantRepository.findByUuid(variantUuid);
    if (!existing || existing.productId !== product.id) {
      throw ApiError.notFound("Variant not found for this product");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.ProductVariantUncheckedUpdateInput = {};

    if (adminId) {
      updateData.updated_by = adminId;
    }

    if (data.variantName !== undefined) {
      updateData.variant_name = data.variantName;
    }

    let unitUuid: string | undefined = undefined;
    let unitName: string | undefined = undefined;
    let unitCode: string | undefined = undefined;
    let unitType: string | undefined = undefined;

    if (data.unitId !== undefined) {
      const unit = await unitRepository.findByUuid(data.unitId);
      if (!unit || !unit.is_active) {
        throw ApiError.badRequest("Invalid or inactive unit");
      }
      updateData.unit_id = unit.id;
      unitUuid = unit.uuid || data.unitId;
      unitName = unit.name;
      unitCode = unit.code;
      unitType = unit.type;
    }

    if (data.sku !== undefined && data.sku !== existing.sku) {
      const skuConflict = await variantRepository.findBySku(data.sku, variantUuid);
      if (skuConflict) {
        throw ApiError.conflict(`An active variant with SKU '${data.sku}' already exists`);
      }
      updateData.sku = data.sku;
    }

    if (data.unitValue !== undefined) {
      updateData.unit_value = data.unitValue;
    }

    if (data.basePrice !== undefined) {
      updateData.base_price = data.basePrice;
    }

    if (data.salePrice !== undefined) {
      updateData.sale_price = data.salePrice;
    }

    if (data.weightGrams !== undefined) {
      updateData.weight_grams = data.weightGrams;
    }

    const updated = await variantRepository.updateByUuid(variantUuid, updateData);
    if (!updated) {
      throw ApiError.notFound("Variant not found");
    }

    return formatAdminVariantResponse(
      updated,
      product.uuid || productUuid,
      unitUuid,
      product.name,
      unitName,
      unitCode,
      unitType
    );
  },

  async deleteAdminVariant(
    productUuid: string,
    variantUuid: string,
    adminEmail?: string
  ) {
    const product = await productRepository.findByUuid(productUuid);
    if (!product || !product.isActive || product.deleted_at !== null) {
      throw ApiError.notFound("Product not found or inactive");
    }

    const existing = await variantRepository.findByUuid(variantUuid);
    if (!existing || existing.productId !== product.id) {
      throw ApiError.notFound("Variant not found for this product");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await variantRepository.softDeleteByUuid(variantUuid, adminId);

    return {
      success: true,
      message: "Variant deleted successfully",
    };
  },
};
