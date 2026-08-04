export interface BannerListItem {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  position: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: Date | null;
  expiresAt: Date | null;
}

export interface GetBannersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface GetBannersResult {
  data: BannerListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBannerInput {
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position?: string;
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: Date;
  expiresAt?: Date;
}

export interface UpdateBannerInput extends Partial<CreateBannerInput> {}
