import { ApiError } from "@/lib/api/api-error";
import { reviewRepository } from "../repositories/review.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  CustomerReviewListInput,
  AdminReviewListInput,
  PublicReviewQueryInput,
  ModerateReviewInput,
} from "../validations/review.schema";
import type {
  ReviewResponse,
  PublicReviewItem,
  ReviewModerateResult,
} from "../types/review.types";

function formatReviewResponse(review: any): ReviewResponse {
  return {
    id: review.uuid || String(review.id),
    productId: review.product?.uuid || String(review.productId),
    orderItemId: review.order_items?.uuid || (review.order_item_id ? String(review.order_item_id) : null),
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    images: (review.images || []).map((img: any) => img.image_url),
    isApproved: review.isApproved,
    product: review.product
      ? {
          id: review.product.uuid || String(review.product.id),
          name: review.product.name,
          slug: review.product.slug,
        }
      : undefined,
    orderItem: review.order_items
      ? {
          id: review.order_items.uuid || String(review.order_items.id),
          productNameSnapshot: review.order_items.product_name_snapshot,
          variantSnapshot: review.order_items.variant_snapshot,
          skuSnapshot: review.order_items.sku_snapshot,
          quantity: review.order_items.quantity,
        }
      : undefined,
    customer: review.user
      ? {
          id: review.user.uuid || String(review.user.id),
          name: review.user.name,
          avatar: review.user.avatar ?? null,
        }
      : undefined,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export const reviewService = {
  async createCustomerReview(
    sessionUserId: string,
    input: CreateReviewInput
  ): Promise<ReviewResponse> {
    // 1. Resolve Customer
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    // 2. Resolve & Validate Order Item & Delivered Order
    const orderItem = await reviewRepository.findOrderItemForReview(
      input.orderItemId,
      customerId
    );

    if (!orderItem) {
      throw ApiError.badRequest(
        "Order item not found or does not belong to your orders"
      );
    }

    if (orderItem.order.order_status !== "delivered") {
      throw ApiError.badRequest(
        `Cannot review items from order with status '${orderItem.order.order_status}'. Only delivered orders can be reviewed.`
      );
    }

    // 3. Verify Product Matching
    if (orderItem.product.uuid !== input.productId) {
      throw ApiError.badRequest(
        "The selected product does not match the product in the order item"
      );
    }

    // 4. Duplicate Active Review Check
    const existingActive = await reviewRepository.findActiveReviewByOrderItem(
      orderItem.id,
      customerId
    );
    if (existingActive) {
      throw ApiError.conflict(
        "You have already submitted a review for this order item"
      );
    }

    // 5. Create Review Transaction
    const created = await reviewRepository.createReviewTransaction({
      productId: orderItem.productId,
      userId: customerId,
      orderItemId: orderItem.id,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images,
    });

    return formatReviewResponse(created);
  },

  async getCustomerReviews(
    sessionUserId: string,
    params: CustomerReviewListInput
  ) {
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    const result = await reviewRepository.findCustomerReviews(
      customerId,
      params
    );

    const data = result.reviews.map(formatReviewResponse);

    return {
      data,
      meta: {
        page: result.page,
        limit: result.limit,
        pageSize: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
    };
  },

  async getCustomerReviewByUuid(
    sessionUserId: string,
    uuid: string
  ): Promise<ReviewResponse> {
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    const review = await reviewRepository.findCustomerReviewByUuid(
      uuid,
      customerId
    );

    if (!review) {
      const anyReview = await reviewRepository.findReviewByUuidOnly(uuid);
      if (anyReview) {
        throw ApiError.forbidden("You do not have access to this review");
      }
      throw ApiError.notFound("Review not found");
    }

    return formatReviewResponse(review);
  },

  async updateCustomerReview(
    sessionUserId: string,
    uuid: string,
    input: UpdateReviewInput
  ): Promise<ReviewResponse> {
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    const existing = await reviewRepository.findCustomerReviewByUuid(
      uuid,
      customerId
    );

    if (!existing) {
      const anyReview = await reviewRepository.findReviewByUuidOnly(uuid);
      if (anyReview) {
        throw ApiError.forbidden("You do not have access to this review");
      }
      throw ApiError.notFound("Review not found");
    }

    const updated = await reviewRepository.updateCustomerReviewTransaction({
      reviewId: existing.id,
      customerId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images,
    });

    return formatReviewResponse(updated);
  },

  async deleteCustomerReview(
    sessionUserId: string,
    uuid: string
  ): Promise<void> {
    const customer = await userRepository.findById(sessionUserId);
    if (!customer) {
      throw ApiError.unauthorized("Customer not found");
    }
    const customerId = BigInt(customer.internalId || customer.id);

    const existing = await reviewRepository.findCustomerReviewByUuid(
      uuid,
      customerId
    );

    if (!existing) {
      const anyReview = await reviewRepository.findReviewByUuidOnly(uuid);
      if (anyReview) {
        throw ApiError.forbidden("You do not have access to this review");
      }
      throw ApiError.notFound("Review not found");
    }

    await reviewRepository.softDeleteReview(existing.id, customerId);
  },

  async getPublicProductReviews(
    identifier: string,
    params: PublicReviewQueryInput
  ) {
    const product = await reviewRepository.findProductByIdentifier(identifier);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    const [reviewsResult, ratingSummary] = await Promise.all([
      reviewRepository.findPublicProductReviews(product.id, params),
      reviewRepository.getPublicProductRatingSummary(product.id),
    ]);

    const publicReviews: PublicReviewItem[] = reviewsResult.reviews.map((r) => ({
      id: r.uuid || String(r.id),
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: (r.images || []).map((img) => img.image_url),
      customerName: r.user.name,
      customerAvatar: r.user.avatar ?? null,
      createdAt: r.createdAt,
    }));

    return {
      reviews: publicReviews,
      ratingSummary,
      meta: {
        page: reviewsResult.page,
        limit: reviewsResult.limit,
        pageSize: reviewsResult.limit,
        total: reviewsResult.total,
        totalPages: Math.ceil(reviewsResult.total / reviewsResult.limit) || 1,
      },
    };
  },

  async getAdminReviews(params: AdminReviewListInput) {
    const result = await reviewRepository.findAdminReviews(params);
    const data = result.reviews.map(formatReviewResponse);

    return {
      data,
      meta: {
        page: result.page,
        limit: result.limit,
        pageSize: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
    };
  },

  async getAdminReviewByUuid(uuid: string): Promise<ReviewResponse> {
    const review = await reviewRepository.findReviewByUuidOnly(uuid);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    return formatReviewResponse(review);
  },

  async moderateReview(
    adminSessionUserId: string,
    uuid: string,
    input: ModerateReviewInput
  ): Promise<ReviewModerateResult> {
    const admin = await userRepository.findById(adminSessionUserId);
    if (!admin) {
      throw ApiError.unauthorized("Admin user not found");
    }
    const adminId = BigInt(admin.internalId || admin.id);

    const review = await reviewRepository.findReviewByUuidOnly(uuid);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    const updated = await reviewRepository.moderateReviewStatus(
      review.id,
      input.isApproved,
      adminId
    );

    return {
      id: updated.uuid || String(updated.id),
      isApproved: updated.isApproved,
      updatedAt: updated.updatedAt,
    };
  },

  async deleteAdminReview(
    adminSessionUserId: string,
    uuid: string
  ): Promise<void> {
    const admin = await userRepository.findById(adminSessionUserId);
    if (!admin) {
      throw ApiError.unauthorized("Admin user not found");
    }
    const adminId = BigInt(admin.internalId || admin.id);

    const review = await reviewRepository.findReviewByUuidOnly(uuid);
    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    await reviewRepository.softDeleteReview(review.id, adminId);
  },
};
