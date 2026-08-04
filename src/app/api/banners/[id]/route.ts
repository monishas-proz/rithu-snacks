import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiFromError } from "@/lib/api/api-response";
import { bannerService } from "@/features/banners/services/banner.service";

export const GET = createApiHandler({
  GET: async (_request, context) => {
    try {
      const id = Number(context.params?.id);
      const banner = await bannerService.getBanner(id);
      return apiSuccess(banner);
    } catch (error) {
      return apiFromError(error);
    }
  },
});

export const PUT = createApiHandler({
  PUT: async (_request, context) => {
    try {
      const id = Number(context.params?.id);
      const body = context.body as Record<string, unknown>;
      const banner = await bannerService.updateBanner(id, body as Parameters<typeof bannerService.updateBanner>[1]);
      return apiSuccess(banner, "Banner updated");
    } catch (error) {
      return apiFromError(error);
    }
  },
}, { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] });

export const DELETE = createApiHandler({
  DELETE: async (_request, context) => {
    try {
      const id = Number(context.params?.id);
      await bannerService.deleteBanner(id);
      return apiSuccess(null, "Banner deleted");
    } catch (error) {
      return apiFromError(error);
    }
  },
}, { requireAuth: true, requiredRole: ["ADMIN", "STAFF"] });
