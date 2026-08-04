import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { bannerService } from "@/features/banners/services/banner.service";
import type { CreateBannerInput } from "@/features/banners/types";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    try {
      const page = Number(context.searchParams?.get("page") || "1");
      const limit = Number(context.searchParams?.get("limit") || "20");
      const search = context.searchParams?.get("search") || undefined;
      const result = await bannerService.getBanners({ page, limit, search });
      return apiSuccess(result);
    } catch (error) {
      return apiFromError(error);
    }
  },
});

export const POST = createApiHandler({
  POST: async (_request, context) => {
    try {
      const body = context.body as CreateBannerInput;
      const banner = await bannerService.createBanner(body);
      return apiSuccess(banner, "Banner created", 201);
    } catch (error) {
      return apiFromError(error);
    }
  },
}, { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] });
