import { ApiError } from "@/lib/api/api-error";
import { slugify } from "@/lib/utils";
import { brandRepository } from "../repositories/brand.repository";
import type { GetBrandsParams, CreateBrandInput, UpdateBrandInput } from "../types";

export const brandService = {
  async getBrands(params: GetBrandsParams = {}) {
    return brandRepository.findAll(params);
  },

  async getBrand(slugOrId: string) {
    const brand = await brandRepository.findBySlugOrId(slugOrId);
    if (!brand) {
      throw ApiError.notFound("Brand not found");
    }
    return brand;
  },

  async createBrand(data: CreateBrandInput) {
    const slug = data.slug || slugify(data.name);

    const existingSlug = await brandRepository.findBySlug(slug);
    if (existingSlug) {
      throw ApiError.conflict("A brand with this slug already exists");
    }

    return brandRepository.create({
      name: data.name,
      slug,
      description: data.description,
      logo: data.logo,
      isActive: data.isActive ?? true,
    });
  },

  async updateBrand(id: number, data: UpdateBrandInput) {
    const existing = await brandRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Brand not found");
    }

    const slug = data.slug || (data.name ? slugify(data.name) : existing.slug);

    if (slug !== existing.slug) {
      const slugExists = await brandRepository.findBySlug(slug);
      if (slugExists) {
        throw ApiError.conflict("A brand with this slug already exists");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    updateData.slug = slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return brandRepository.update(id, updateData as never);
  },

  async deleteBrand(id: number) {
    const existing = await brandRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Brand not found");
    }

    if (existing._count.products && existing._count.products > 0) {
      throw ApiError.badRequest(
        "Cannot delete brand with existing products. Remove or reassign products first."
      );
    }

    return brandRepository.delete(id);
  },
};
