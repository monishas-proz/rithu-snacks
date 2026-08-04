import { ApiError } from "@/lib/api/api-error";
import { categoryRepository } from "../repositories/category.repository";
import type { GetCategoriesParams, CreateCategoryInput, UpdateCategoryInput } from "../types";

export const categoryService = {
  async getCategories(params: GetCategoriesParams = {}) {
    return categoryRepository.findAll(params);
  },

  async getCategory(slugOrId: string) {
    const category = await categoryRepository.findBySlugOrId(slugOrId);
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return category;
  },

  async getCategoryById(id: number) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return category;
  },

  async createCategory(data: CreateCategoryInput) {
    const existingSlug = await categoryRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw ApiError.conflict("A category with this slug already exists");
    }

    if (data.parentId) {
      const parent = await categoryRepository.findById(data.parentId);
      if (!parent) {
        throw ApiError.badRequest("Parent category not found");
      }
    }

    return categoryRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
    });
  },

  async updateCategory(id: number, data: UpdateCategoryInput) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await categoryRepository.findBySlug(data.slug);
      if (slugExists) {
        throw ApiError.conflict("A category with this slug already exists");
      }
    }

    if (data.parentId && data.parentId === id) {
      throw ApiError.badRequest("A category cannot be its own parent");
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.parentId !== undefined) {
      updateData.parent = data.parentId ? { connect: { id: data.parentId } } : { disconnect: true };
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;

    return categoryRepository.update(id, updateData as never);
  },

  async deleteCategory(id: number) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound("Category not found");
    }

    if (existing._count.products > 0) {
      throw ApiError.badRequest(
        "Cannot delete category with existing products. Remove or reassign products first."
      );
    }

    if (existing._count.children > 0) {
      throw ApiError.badRequest(
        "Cannot delete category with subcategories. Remove or reassign subcategories first."
      );
    }

    return categoryRepository.delete(id);
  },
};
