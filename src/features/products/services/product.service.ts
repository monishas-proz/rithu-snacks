import crypto from "crypto";
import { ApiError } from "@/lib/api/api-error";
import { productRepository } from "../repositories/product.repository";
import { categoryRepository } from "@/features/categories/repositories/category.repository";
import { brandRepository } from "@/features/brands/repositories/brand.repository";
import { hsnCodeRepository } from "@/features/hsn-codes/repositories/hsn-code.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type { Prisma, $Enums } from "@/generated/prisma";
import type {
  AdminProductResponse,
  GetAdminProductsParams,
} from "../types";
import type {
  CreateAdminProductInput,
  UpdateAdminProductInput,
  VegType,
} from "../validations/admin-product.schema";

async function formatAdminProductResponse(
  product: {
    id: bigint;
    uuid: string | null;
    categoryId: bigint | null;
    brandId: bigint | null;
    hsn_code_id: bigint | null;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    veg_type: $Enums.products_veg_type;
    isFeatured: boolean;
    status: boolean | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    brand?: { id: bigint; uuid: string | null; name: string; isActive: boolean } | null;
    product_hsn_codes?: { id: bigint; uuid: string | null; code: string; is_active: boolean } | null;
  },
  cachedCategoryUuid?: string | null
): Promise<AdminProductResponse> {
  const productUuid = product.uuid || String(product.id);
  
  let categoryUuid: string | null = null;
  if (cachedCategoryUuid !== undefined && cachedCategoryUuid !== null) {
    categoryUuid = cachedCategoryUuid;
  } else if (product.categoryId) {
    const category = await categoryRepository.findById(product.categoryId);
    categoryUuid = category?.uuid ?? null;
  }

  const brandUuid = product.brand?.uuid ?? null;
  const hsnUuid = product.product_hsn_codes?.uuid ?? null;

  return {
    id: productUuid,
    categoryId: categoryUuid,
    brandId: brandUuid,
    hsnCodeId: hsnUuid,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? null,
    description: product.description ?? null,
    vegType: product.veg_type as VegType,
    isFeatured: Boolean(product.isFeatured),
    status: Boolean(product.status),
    isActive: Boolean(product.isActive),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function getAdminInternalId(email?: string): Promise<bigint | null> {
  if (!email) return null;
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return BigInt(user.internalId || user.id);
}

export const productService = {
  async createAdminProduct(
    data: CreateAdminProductInput,
    adminEmail?: string
  ): Promise<AdminProductResponse> {
    const adminId = await getAdminInternalId(adminEmail);

    // 1. Resolve & Validate Category UUID
    const category = await categoryRepository.findByUuid(data.categoryId);
    if (!category || !category.isActive) {
      throw ApiError.badRequest("Invalid or inactive category");
    }

    // 2. Resolve & Validate Brand UUID
    const brand = await brandRepository.findByUuid(data.brandId);
    if (!brand || !brand.isActive) {
      throw ApiError.badRequest("Invalid or inactive brand");
    }

    // 3. Resolve & Validate HSN Code UUID
    const hsnCode = await hsnCodeRepository.findByUuid(data.hsnCodeId);
    if (!hsnCode || !hsnCode.is_active) {
      throw ApiError.badRequest("Invalid or inactive HSN code");
    }

    // 4. Check duplicate slug
    const existingSlug = await productRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw ApiError.conflict(`An active product with slug '${data.slug}' already exists`);
    }

    // 5. Check duplicate name
    const existingName = await productRepository.findByName(data.name);
    if (existingName) {
      throw ApiError.conflict(`An active product with name '${data.name}' already exists`);
    }

    const created = await productRepository.create({
      uuid: crypto.randomUUID(),
      categoryId: category.id,
      brandId: brand.id,
      hsn_code_id: hsnCode.id,
      name: data.name,
      slug: data.slug, // Frontend-supplied slug preserved without modification
      shortDescription: data.shortDescription ?? null,
      description: data.description ?? null,
      veg_type: data.vegType as $Enums.products_veg_type,
      isFeatured: data.isFeatured ?? false,
      status: true, // Static reserved field - always true
      isActive: true, // Active status
      created_by: adminId,
      updated_by: adminId,
    });

    return formatAdminProductResponse(created, category.uuid);
  },

  async getAdminProducts(params: GetAdminProductsParams = {}) {
    const result = await productRepository.findAdminAll(params);
    const data = await Promise.all(
      result.data.map((item) => formatAdminProductResponse(item))
    );

    return {
      data,
      meta: result.meta,
    };
  },

  async getAdminProductByUuid(uuid: string): Promise<AdminProductResponse> {
    const product = await productRepository.findByUuid(uuid);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }
    return formatAdminProductResponse(product);
  },

  async updateAdminProduct(
    uuid: string,
    data: UpdateAdminProductInput,
    adminEmail?: string
  ): Promise<AdminProductResponse> {
    const existing = await productRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Product not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    const updateData: Prisma.ProductUncheckedUpdateInput = {};
    let categoryUuid: string | null | undefined = undefined;

    if (adminId) {
      updateData.updated_by = adminId;
    }

    // Resolve Category UUID if provided
    if (data.categoryId !== undefined) {
      const category = await categoryRepository.findByUuid(data.categoryId);
      if (!category || !category.isActive) {
        throw ApiError.badRequest("Invalid or inactive category");
      }
      updateData.categoryId = category.id;
      categoryUuid = category.uuid;
    }

    // Resolve Brand UUID if provided
    if (data.brandId !== undefined) {
      const brand = await brandRepository.findByUuid(data.brandId);
      if (!brand || !brand.isActive) {
        throw ApiError.badRequest("Invalid or inactive brand");
      }
      updateData.brandId = brand.id;
    }

    // Resolve HSN Code UUID if provided
    if (data.hsnCodeId !== undefined) {
      const hsnCode = await hsnCodeRepository.findByUuid(data.hsnCodeId);
      if (!hsnCode || !hsnCode.is_active) {
        throw ApiError.badRequest("Invalid or inactive HSN code");
      }
      updateData.hsn_code_id = hsnCode.id;
    }

    // Check duplicate slug if slug changes
    if (data.slug !== undefined && data.slug !== existing.slug) {
      const slugConflict = await productRepository.findBySlug(data.slug, uuid);
      if (slugConflict) {
        throw ApiError.conflict(`An active product with slug '${data.slug}' already exists`);
      }
      updateData.slug = data.slug;
    }

    // Check duplicate name if name changes
    if (data.name !== undefined && data.name !== existing.name) {
      const nameConflict = await productRepository.findByName(data.name, uuid);
      if (nameConflict) {
        throw ApiError.conflict(`An active product with name '${data.name}' already exists`);
      }
      updateData.name = data.name;
    }

    if (data.shortDescription !== undefined) {
      updateData.shortDescription = data.shortDescription;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.vegType !== undefined) {
      updateData.veg_type = data.vegType as $Enums.products_veg_type;
    }

    if (data.isFeatured !== undefined) {
      updateData.isFeatured = data.isFeatured;
    }

    const updated = await productRepository.updateByUuid(uuid, updateData);
    if (!updated) {
      throw ApiError.notFound("Product not found");
    }

    return formatAdminProductResponse(updated, categoryUuid);
  },

  async deleteAdminProduct(uuid: string, adminEmail?: string) {
    const existing = await productRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Product not found");
    }

    const adminId = await getAdminInternalId(adminEmail);
    await productRepository.softDeleteByUuid(uuid, adminId);

    return {
      success: true,
      message: "Product deleted successfully",
    };
  },
};
