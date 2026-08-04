import { apiClient } from "@/lib/api/api-client";
import { GetBannersParams, GetBannersResult, CreateBannerInput, UpdateBannerInput } from "../types";

const BASE_URL = "/api/banners";

export const bannerApi = {
  async getBanners(params?: GetBannersParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));

    const queryString = searchParams.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await apiClient.get<GetBannersResult>(url);
    return response.data!;
  },

  async getBanner(id: number) {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data!;
  },

  async createBanner(data: CreateBannerInput) {
    const response = await apiClient.post(BASE_URL, data);
    return response.data!;
  },

  async updateBanner(id: number, data: UpdateBannerInput) {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data);
    return response.data!;
  },

  async deleteBanner(id: number) {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    return response.data!;
  },
};
