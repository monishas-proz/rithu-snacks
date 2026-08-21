import { ApiError } from "@/lib/api/api-error";
import { catalogRepository } from "../repositories/catalog.repository";
import type {
  CustomerBrandListInput,
  CustomerCategoryListInput,
  CustomerProductListInput,
  CustomerVariantListInput,
  CustomerGlobalVariantListInput,
} from "../validations/catalog.schema";

export const catalogService = {
  // Brand Methods
  async getBrands(params: CustomerBrandListInput) {
    return catalogRepository.findCustomerBrands(params);
  },

  async getBrandByUuid(uuid: string) {
    const brand = await catalogRepository.findCustomerBrandByUuid(uuid);
    if (!brand) {
      throw ApiError.notFound("Brand not found");
    }
    return brand;
  },

  // Category Methods
  async getCategories(params: CustomerCategoryListInput) {
    return catalogRepository.findCustomerCategories(params);
  },

  async getCategoryByUuid(uuid: string) {
    const category = await catalogRepository.findCustomerCategoryByUuid(uuid);
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return category;
  },

  // Product Methods
  async getProducts(params: CustomerProductListInput) {
    return catalogRepository.findCustomerProducts(params);
  },

  async getProductByUuid(uuid: string) {
    const product = await catalogRepository.findCustomerProductByUuid(uuid);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }
    return product;
  },

  // Variant Methods
  async getVariants(productUuid: string, params: CustomerVariantListInput) {
    const result = await catalogRepository.findCustomerVariantsByProductUuid(
      productUuid,
      params
    );
    if (!result) {
      throw ApiError.notFound("Product not found");
    }
    return result;
  },

  async getVariantByUuids(productUuid: string, variantUuid: string) {
    const variant = await catalogRepository.findCustomerVariantByUuids(
      productUuid,
      variantUuid
    );
    if (!variant) {
      throw ApiError.notFound("Variant not found");
    }
    return variant;
  },

  async getGlobalVariants(params: CustomerGlobalVariantListInput) {
    return catalogRepository.findCustomerGlobalVariants(params);
  },
};
