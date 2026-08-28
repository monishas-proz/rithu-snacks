export interface ReviewUserBasic {
  id: string;
  name: string;
  avatar: string | null;
}

export interface ReviewProductBasic {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string | null;
}

export interface ReviewOrderItemBasic {
  id: string;
  productNameSnapshot: string;
  variantSnapshot: string;
  skuSnapshot: string;
  quantity: number;
}

export interface ReviewResponse {
  id: string;
  productId: string;
  orderItemId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  isApproved: boolean;
  product?: ReviewProductBasic;
  orderItem?: ReviewOrderItemBasic;
  customer?: ReviewUserBasic;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  customerName: string;
  customerAvatar: string | null;
  createdAt: Date;
}

export interface RatingBreakdown {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
}

export interface PublicReviewsResponse {
  reviews: PublicReviewItem[];
  ratingSummary: {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: RatingBreakdown;
  };
}

export interface ReviewModerateResult {
  id: string;
  isApproved: boolean;
  updatedAt: Date;
}
