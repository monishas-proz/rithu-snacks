export interface BrandListItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  createdAt: Date;
  _count?: { products?: number };
}

export interface BrandDetail extends BrandListItem {
  products?: { id: number; name: string; slug: string; price: number; isActive: boolean }[];
}

export interface GetBrandsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface GetBrandsResult {
  data: BrandListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

export interface UpdateBrandInput extends Partial<CreateBrandInput> {}
