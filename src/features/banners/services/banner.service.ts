import { ApiError } from "@/lib/api/api-error";
import { GetBannersParams, GetBannersResult, CreateBannerInput, UpdateBannerInput } from "../types";
import { bannerRepository } from "../repositories/banner.repository";

export const bannerService = {
  async getBanners(params: GetBannersParams): Promise<GetBannersResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const { data, total } = await bannerRepository.findAll({
      ...params,
      page,
      limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getBanner(id: number) {
    const banner = await bannerRepository.findById(id);

    if (!banner) {
      throw ApiError.notFound("Banner not found");
    }

    return banner;
  },

  async createBanner(input: CreateBannerInput) {
    return bannerRepository.create({
      title: input.title,
      subtitle: input.subtitle ?? null,
      image: input.image,
      link: input.link ?? null,
      position: input.position ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
    });
  },

  async updateBanner(id: number, input: UpdateBannerInput) {
    await this.getBanner(id);

    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.subtitle !== undefined) data.subtitle = input.subtitle ?? null;
    if (input.image !== undefined) data.image = input.image;
    if (input.link !== undefined) data.link = input.link ?? null;
    if (input.position !== undefined) data.position = input.position ?? null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.startsAt !== undefined) data.startsAt = input.startsAt ?? null;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ?? null;

    return bannerRepository.update(id, data);
  },

  async deleteBanner(id: number) {
    await this.getBanner(id);
    return bannerRepository.delete(id);
  },
};
