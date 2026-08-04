import { NextRequest } from "next/server";
import { db } from "@/lib/db/prisma";
import { apiSuccess, apiNotFound, apiError } from "@/lib/api/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await db.review.findMany({
      where: {
        productId: parseInt(id),
        isApproved: true,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(reviews, "Reviews fetched successfully");
  } catch (error) {
    console.error("Get reviews error:", error);
    return apiError("Failed to fetch reviews", 500);
  }
}
