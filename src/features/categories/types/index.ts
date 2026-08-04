export interface CategoryListItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: number | null;
  isActive: boolean;
  sortOrder: number;
  _count: {
    products: number;
    children: number;
  };
}

export interface CategoryDetail extends CategoryListItem {
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent: {
    id: number;
    name: string;
    slug: string;
  } | null;
  children: {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    _count: { products: number };
  }[];
  products: {
    id: number;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    discountPercent: number;
    isActive: boolean;
    images: { id: number; url: string; altText: string | null; isPrimary: boolean }[];
    brand: { id: number; name: string; slug: string } | null;
  }[];
}

export interface GetCategoriesParams {
  search?: string;
  parentId?: number | null;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number | null;
  isActive?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}
