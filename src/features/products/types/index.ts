export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  sku: string;
  price: number;
  comparePrice: number | null;
  discountPercent: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: number; name: string; slug: string } | null;
  brand: { id: number; name: string; slug: string } | null;
  images: { id: number; url: string; altText: string | null }[];
  _count: { reviews: number; orderItems: number };
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  costPrice: number | null;
  taxRate: number;
  isDigital: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants: {
    id: number;
    name: string;
    sku: string;
    price: number;
    comparePrice: number | null;
    stockQuantity: number;
    weight: number | null;
    isActive: boolean;
  }[];
  reviews: {
    id: number;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: Date;
    user: { id: number; name: string; image: string | null };
  }[];
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  sort?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface GetProductsResult {
  data: ProductListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId: number;
  brandId?: number | null;
  sku: string;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  taxRate?: number;
  discountPercent?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}
