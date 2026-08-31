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
  VariantPriceHistoryResponse,
  GetVariantPriceHistoryParams,
  PriceHistoryChartItem,
  BulkEditVariantsInput,
} from "../types";
import type {
  CreateAdminVariantInput,
  UpdateAdminVariantInput,
} from "../validations/admin-variant.schema";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function formatAdminVariantResponse(
  variant: {
    id: bigint;
    uuid: string;
    productId: bigint;
    variant_name?: string | null;
    sku: string;
    slug?: string | null;
    unit_value: Prisma.Decimal | number;
    unit_id: bigint;
    base_price: Prisma.Decimal | number;
    sale_price: Prisma.Decimal | number;
    isActive: boolean;
    out_of_stock?: boolean;
    createdAt: Date;
    updatedAt: Date;
    product?: { uuid: string | null; name: string } | null;
    product_units?: { uuid: string | null; name: string; code: string; type?: string | null } | null;
    product_variant_images?: Array<{ image_url: string; is_primary: boolean }> | null;
    inventories?: { quantity_available: number; quantity_reserved: number } | null;
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

  const unitUuid =
    cachedUnitUuid ||
    variant.product_units?.uuid ||
    (variant.unit_id ? String(variant.unit_id) : null);

  const measurement = formatVariantMeasurement(
    { type: unitType, code: unitCode, uuid: unitUuid },
    variant.unit_value,
    unitUuid
  );

  const stock =
    variant.inventories?.quantity_available !== undefined
      ? Number(variant.inventories.quantity_available)
      : undefined;

  return {
    id: variantUuid,
    productId: productUuid,
    productName,
    variantName,
    slug: variant.slug || "",
    measurement,
    sku: variant.sku,
    basePrice: Number(variant.base_price),
    salePrice: variant.sale_price !== null && Number(variant.sale_price) > 0 ? Number(variant.sale_price) : Number(variant.base_price),
    stock,
    primaryImage,
    isActive: Boolean(variant.isActive),
    outOfStock: Boolean(variant.out_of_stock),
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  };
}

function formatVariantPriceHistory(
  item: Prisma.variant_price_historyGetPayload<{
    include: {
      users_variant_price_history_created_byTousers: {
        select: {
          id: true;
          uuid: true;
          name: true;
        };
      };
    };
  }>
): VariantPriceHistoryResponse {
  const user = item.users_variant_price_history_created_byTousers;
  const oldPrice = item.old_base_price !== null ? Number(item.old_base_price) : null;
  const newPrice = item.new_base_price !== null ? Number(item.new_base_price) : null;
  const oldSalePrice = item.old_sale_price !== null ? Number(item.old_sale_price) : null;
  const newSalePrice = item.new_sale_price !== null ? Number(item.new_sale_price) : null;

  return {
    id: item.uuid || String(item.id),
    oldPrice,
    newPrice,
    oldSalePrice,
    newSalePrice,
    oldBasePrice: oldPrice,
    newBasePrice: newPrice,
    changedAt: item.changed_at,
    changedBy: user
      ? {
          id: user.uuid || String(user.id),
          name: user.name,
        }
      : null,
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

    // 3. Unique SKU Check
    const existingSku = await variantRepository.findBySku(data.sku);
    if (existingSku) {
      throw ApiError.conflict(`An active variant with SKU '${data.sku}' already exists`);
    }

    // 4. Derive variant_name & Validate Slug
    const variantName = data.variantName || `${data.unitValue} ${unit.code}`;
    const variantSlug = slugify(data.slug).substring(0, 250);

    // Check slug uniqueness
    const existingSlug = await variantRepository.findBySlug(variantSlug);
    if (existingSlug) {
      throw ApiError.conflict(`An active variant with slug '${data.slug}' already exists`);
    }

    const effectiveBasePrice = data.price !== undefined ? data.price : (data.basePrice ?? 0);

    // 5. Create Variant
    const variant = await variantRepository.create({
      uuid: crypto.randomUUID(),
      productId: product.id,
      variant_name: variantName,
      sku: data.sku,
      slug: variantSlug,
      unit_value: data.unitValue,
      unit_id: unit.id,
      base_price: effectiveBasePrice,
      sale_price: data.salePrice,
      isActive: data.isActive !== undefined ? data.isActive : true,
      out_of_stock: data.outOfStock !== undefined ? data.outOfStock : false,
      created_by: adminId,
      updated_by: adminId,
    });

    if (data.stock !== undefined) {
      await variantRepository.updateByUuid(
        variant.uuid,
        { stock: data.stock },
        adminId
      );
    }

    const createdVariantWithDetails = await variantRepository.findByUuid(variant.uuid);

    return formatAdminVariantResponse(
      createdVariantWithDetails || variant,
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

  async countAdminVariants(
    params: AdminVariantListParams = {}
  ): Promise<{ count: number }> {
    const count = await variantRepository.countAdminVariants(params);
    return { count };
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

  async getVariantByUuid(variantUuid: string): Promise<AdminVariantResponse> {
    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    return formatAdminVariantResponse(variant);
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
    const updateData: Prisma.ProductVariantUncheckedUpdateInput & { stock?: number } = {};

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

    if (data.slug !== undefined) {
      const normalizedSlug = slugify(data.slug).substring(0, 250);
      const slugConflict = await variantRepository.findBySlug(normalizedSlug, variantUuid);
      if (slugConflict) {
        throw ApiError.conflict(`A variant with slug '${data.slug}' already exists`);
      }
      updateData.slug = normalizedSlug;
    }

    if (data.unitValue !== undefined) {
      updateData.unit_value = data.unitValue;
    }

    const effectiveBasePrice = data.price !== undefined ? data.price : data.basePrice;
    if (effectiveBasePrice !== undefined) {
      updateData.base_price = effectiveBasePrice;
    }

    if (data.salePrice !== undefined) {
      updateData.sale_price = data.salePrice;
    }

    if (typeof data.isActive === "boolean") {
      updateData.isActive = data.isActive;
    }

    if (typeof data.outOfStock === "boolean") {
      updateData.out_of_stock = data.outOfStock;
    }

    if (data.stock !== undefined) {
      updateData.stock = data.stock;
    }

    const updated = await variantRepository.updateByUuid(variantUuid, updateData, adminId);
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

  async updateVariantByUuid(
    variantUuid: string,
    data: UpdateAdminVariantInput,
    adminEmail?: string
  ): Promise<AdminVariantResponse> {
    const existing = await variantRepository.findByUuid(variantUuid);
    if (!existing || existing.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.ProductVariantUncheckedUpdateInput & { stock?: number } = {};

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

    if (data.slug !== undefined) {
      const normalizedSlug = slugify(data.slug).substring(0, 250);
      const slugConflict = await variantRepository.findBySlug(normalizedSlug, variantUuid);
      if (slugConflict) {
        throw ApiError.conflict(`A variant with slug '${data.slug}' already exists`);
      }
      updateData.slug = normalizedSlug;
    }

    if (data.unitValue !== undefined) {
      updateData.unit_value = data.unitValue;
    }

    const effectiveBasePrice = data.price !== undefined ? data.price : data.basePrice;
    if (effectiveBasePrice !== undefined) {
      updateData.base_price = effectiveBasePrice;
    }

    if (data.salePrice !== undefined) {
      updateData.sale_price = data.salePrice;
    }

    if (typeof data.isActive === "boolean") {
      updateData.isActive = data.isActive;
    }

    if (typeof data.outOfStock === "boolean") {
      updateData.out_of_stock = data.outOfStock;
    }

    if (data.stock !== undefined) {
      updateData.stock = data.stock;
    }

    const updated = await variantRepository.updateByUuid(variantUuid, updateData, adminId);
    if (!updated) {
      throw ApiError.notFound("Variant not found");
    }

    return formatAdminVariantResponse(
      updated,
      undefined,
      unitUuid,
      undefined,
      unitName,
      unitCode,
      unitType
    );
  },

  async bulkUpdateVariants(
    body: { variants: Array<{ id: string; price?: number; basePrice?: number; salePrice?: number; stock?: number; isActive?: boolean; outOfStock?: boolean }> },
    adminEmail?: string
  ): Promise<AdminVariantResponse[]> {
    const adminId = await getAdminInternalId(adminEmail);

    try {
      const updatedVariants = await variantRepository.bulkUpdateVariants(
        body.variants,
        adminId
      );

      return updatedVariants.map((item) => formatAdminVariantResponse(item));
    } catch (e: any) {
      if (e.message && e.message.includes("not found")) {
        throw ApiError.notFound(e.message);
      }
      throw e;
    }
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

  async getVariantPriceHistory(
    variantUuid: string,
    params: GetVariantPriceHistoryParams = {}
  ) {
    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const result = await variantRepository.findPriceHistoryByVariantId(
      variant.id,
      params
    );

    const data = result.data.map(formatVariantPriceHistory);

    return {
      data,
      meta: result.meta,
    };
  },

  async getVariantPriceHistoryChart(
    variantUuid: string,
    period: string = "1y"
  ): Promise<PriceHistoryChartItem[]> {
    const variant = await variantRepository.findByUuid(variantUuid);
    if (!variant || variant.deleted_at !== null) {
      throw ApiError.notFound("Variant not found");
    }

    const currentBasePrice = Number(variant.base_price);
    const currentSalePrice =
      variant.sale_price !== null && Number(variant.sale_price) > 0
        ? Number(variant.sale_price)
        : currentBasePrice;

    // Get all price histories chronologically
    const histories = await variantRepository.findPriceHistoryAllByVariantId(variant.id);

    // Determine number of months
    let monthsCount = 12;
    if (period === "1m") monthsCount = 1;
    else if (period === "3m") monthsCount = 3;
    else if (period === "6m") monthsCount = 6;
    else if (period === "1y") monthsCount = 12;

    const now = new Date();
    const monthsList: string[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      monthsList.push(`${year}-${month}`);
    }

    const chartData: PriceHistoryChartItem[] = [];

    for (const monthStr of monthsList) {
      const [yearStr, monthNumStr] = monthStr.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthNumStr, 10);
      // End of this month (e.g. 2025-09-30 23:59:59.999 UTC)
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      // Find histories up to this month end
      const historiesUpToMonth = histories.filter(
        (h) => new Date(h.changed_at) <= endOfMonth
      );

      let price = currentBasePrice;
      let salePrice = currentSalePrice;

      if (historiesUpToMonth.length > 0) {
        // The latest record up to this month end
        const latestRecord = historiesUpToMonth[historiesUpToMonth.length - 1];
        price =
          latestRecord.new_base_price !== null
            ? Number(latestRecord.new_base_price)
            : currentBasePrice;
        salePrice =
          latestRecord.new_sale_price !== null && Number(latestRecord.new_sale_price) > 0
            ? Number(latestRecord.new_sale_price)
            : price;
      } else if (histories.length > 0) {
        // Price history exists but happened after this month; use the oldest old_price
        const earliestRecord = histories[0];
        price =
          earliestRecord.old_base_price !== null
            ? Number(earliestRecord.old_base_price)
            : currentBasePrice;
        salePrice =
          earliestRecord.old_sale_price !== null && Number(earliestRecord.old_sale_price) > 0
            ? Number(earliestRecord.old_sale_price)
            : price;
      }

      chartData.push({
        month: monthStr,
        price,
        salePrice,
      });
    }

    return chartData;
  },
};
