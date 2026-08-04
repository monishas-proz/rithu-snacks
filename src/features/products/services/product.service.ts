import { ApiError } from "@/lib/api/api-error";
import { productRepository } from "../repositories/product.repository";
import type { GetProductsParams, CreateProductInput, UpdateProductInput } from "../types";

export const productService = {
  async getProducts(params: GetProductsParams) {
    return productRepository.findAll(params);
  },

  async getProduct(slugOrId: string) {
    const product = await productRepository.findBySlugOrId(slugOrId);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }
    return product;
  },

  async getProductById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }
    return product;
  },

  async createProduct(data: CreateProductInput) {
    const existingSlug = await productRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw ApiError.conflict("A product with this slug already exists");
    }

    return productRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      category: { connect: { id: data.categoryId } },
      brand: data.brandId ? { connect: { id: data.brandId } } : undefined,
      sku: data.sku,
      price: data.price,
      comparePrice: data.comparePrice ?? null,
      costPrice: data.costPrice ?? null,
      taxRate: data.taxRate ?? 0,
      discountPercent: data.discountPercent ?? 0,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      isDigital: data.isDigital ?? false,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
    });
  },

  async updateProduct(id: number, data: UpdateProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Product not found");
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await productRepository.findBySlug(data.slug);
      if (slugExists) {
        throw ApiError.conflict("A product with this slug already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.brandId !== undefined) updateData.brand = data.brandId ? { connect: { id: data.brandId } } : { disconnect: true };
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
    if (data.discountPercent !== undefined) updateData.discountPercent = data.discountPercent;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isDigital !== undefined) updateData.isDigital = data.isDigital;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;

    return productRepository.update(id, updateData as never);
  },

  async deleteProduct(id: number) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Product not found");
    }
    return productRepository.delete(id);
  },
};
