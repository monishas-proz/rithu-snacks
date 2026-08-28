import crypto from "crypto";
import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type {
  CustomerReviewListInput,
  AdminReviewListInput,
  PublicReviewQueryInput,
} from "../validations/review.schema";

const reviewInclude = {
  product: {
    select: {
      id: true,
      uuid: true,
      name: true,
      slug: true,
    },
  },
  order_items: {
    select: {
      id: true,
      uuid: true,
      product_name_snapshot: true,
      variant_snapshot: true,
      sku_snapshot: true,
      quantity: true,
    },
  },
  user: {
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
  images: {
    where: { is_active: true },
    select: {
      id: true,
      image_url: true,
    },
  },
};

export const reviewRepository = {
  async findProductByIdentifier(identifier: string) {
    const isNum = !isNaN(Number(identifier)) && !identifier.includes("-");
    const orConditions: Prisma.ProductWhereInput[] = [
      { uuid: identifier },
      { slug: identifier },
    ];
    if (isNum) {
      orConditions.push({ id: BigInt(identifier) });
    }

    return db.product.findFirst({
      where: {
        OR: orConditions,
        isActive: true,
      },
    });
  },

  async findOrderItemForReview(orderItemUuid: string, customerId: bigint) {
    return db.orderItem.findFirst({
      where: {
        uuid: orderItemUuid,
        is_active: true,
        order: {
          userId: customerId,
          is_active: true,
        },
      },
      include: {
        order: true,
        product: true,
      },
    });
  },

  async findActiveReviewByOrderItem(orderItemId: bigint, customerId: bigint) {
    return db.review.findFirst({
      where: {
        order_item_id: orderItemId,
        userId: customerId,
        is_active: true,
      },
    });
  },

  async createReviewTransaction(params: {
    productId: bigint;
    userId: bigint;
    orderItemId: bigint;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
  }) {
    const reviewUuid = crypto.randomUUID();

    return db.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          uuid: reviewUuid,
          productId: params.productId,
          userId: params.userId,
          order_item_id: params.orderItemId,
          rating: params.rating,
          title: params.title || null,
          comment: params.comment || null,
          isApproved: false,
          is_active: true,
          created_by: params.userId,
          updated_by: params.userId,
        },
      });

      if (params.images && params.images.length > 0) {
        await tx.reviewImage.createMany({
          data: params.images.map((img) => ({
            reviewId: review.id,
            image_url: img,
            is_active: true,
            created_by: params.userId,
            updated_by: params.userId,
          })),
        });
      }

      return tx.review.findUniqueOrThrow({
        where: { id: review.id },
        include: reviewInclude,
      });
    });
  },

  async findCustomerReviews(
    customerId: bigint,
    params: CustomerReviewListInput
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      userId: customerId,
      is_active: true,
    };

    if (params.isApproved !== undefined) {
      where.isApproved = params.isApproved;
    }

    if (params.rating !== undefined) {
      where.rating = params.rating;
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { title: { contains: s } },
        { comment: { contains: s } },
        { product: { name: { contains: s } } },
      ];
    }

    const sortOrder = params.sortOrder ?? "desc";
    const sortBy = params.sortBy ?? "createdAt";
    const orderBy: Prisma.ReviewOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: reviewInclude,
      }),
      db.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
    };
  },

  async findCustomerReviewByUuid(uuid: string, customerId: bigint) {
    return db.review.findFirst({
      where: {
        uuid,
        userId: customerId,
        is_active: true,
      },
      include: reviewInclude,
    });
  },

  async findReviewByUuidOnly(uuid: string) {
    return db.review.findFirst({
      where: {
        uuid,
        is_active: true,
      },
      include: reviewInclude,
    });
  },

  async updateCustomerReviewTransaction(params: {
    reviewId: bigint;
    customerId: bigint;
    rating?: number;
    title?: string;
    comment?: string;
    images?: string[];
  }) {
    return db.$transaction(async (tx) => {
      const dataToUpdate: Prisma.ReviewUncheckedUpdateInput = {
        isApproved: false, // Reset approval upon customer edit
        updated_by: params.customerId,
      };

      if (params.rating !== undefined) dataToUpdate.rating = params.rating;
      if (params.title !== undefined) dataToUpdate.title = params.title || null;
      if (params.comment !== undefined) dataToUpdate.comment = params.comment || null;

      const updated = await tx.review.update({
        where: { id: params.reviewId },
        data: dataToUpdate,
      });

      if (params.images !== undefined) {
        // Soft deactivate existing active images
        await tx.reviewImage.updateMany({
          where: { reviewId: params.reviewId, is_active: true },
          data: { is_active: false, updated_by: params.customerId },
        });

        // Insert new active images
        if (params.images.length > 0) {
          await tx.reviewImage.createMany({
            data: params.images.map((img) => ({
              reviewId: params.reviewId,
              image_url: img,
              is_active: true,
              created_by: params.customerId,
              updated_by: params.customerId,
            })),
          });
        }
      }

      return tx.review.findUniqueOrThrow({
        where: { id: updated.id },
        include: reviewInclude,
      });
    });
  },

  async softDeleteReview(reviewId: bigint, updatedBy: bigint) {
    return db.review.update({
      where: { id: reviewId },
      data: {
        is_active: false,
        updated_by: updatedBy,
      },
    });
  },

  async findPublicProductReviews(
    productId: bigint,
    params: PublicReviewQueryInput
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      productId,
      isApproved: true,
      is_active: true,
    };

    if (params.rating !== undefined) {
      where.rating = params.rating;
    }

    const sortOrder = params.sortOrder ?? "desc";
    const sortBy = params.sortBy ?? "createdAt";
    const orderBy: Prisma.ReviewOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
          images: {
            where: { is_active: true },
            select: {
              image_url: true,
            },
          },
        },
      }),
      db.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
    };
  },

  async getPublicProductRatingSummary(productId: bigint) {
    const where: Prisma.ReviewWhereInput = {
      productId,
      isApproved: true,
      is_active: true,
    };

    const [agg, ratingGroups] = await Promise.all([
      db.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { id: true },
      }),
      db.review.groupBy({
        by: ["rating"],
        where,
        _count: { id: true },
      }),
    ]);

    const breakdown = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };

    ratingGroups.forEach((g) => {
      const key = String(g.rating) as keyof typeof breakdown;
      if (key in breakdown) {
        breakdown[key] = g._count.id;
      }
    });

    const averageRating = agg._avg.rating
      ? Math.round(agg._avg.rating * 10) / 10
      : 0;

    return {
      averageRating,
      totalReviews: agg._count.id,
      ratingBreakdown: breakdown,
    };
  },

  async findAdminReviews(params: AdminReviewListInput) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      is_active: true,
    };

    if (params.isApproved !== undefined) {
      where.isApproved = params.isApproved;
    }

    if (params.rating !== undefined) {
      where.rating = params.rating;
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { title: { contains: s } },
        { comment: { contains: s } },
        { product: { name: { contains: s } } },
        { user: { name: { contains: s } } },
        { user: { email: { contains: s } } },
      ];
    }

    const sortOrder = params.sortOrder ?? "desc";
    const sortBy = params.sortBy ?? "createdAt";
    const orderBy: Prisma.ReviewOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: reviewInclude,
      }),
      db.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
    };
  },

  async moderateReviewStatus(
    reviewId: bigint,
    isApproved: boolean,
    adminId: bigint
  ) {
    return db.review.update({
      where: { id: reviewId },
      data: {
        isApproved,
        updated_by: adminId,
      },
      include: reviewInclude,
    });
  },
};
