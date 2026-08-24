"use client";

import * as React from "react";
import Image from "next/image";
import { ICONS } from "@/constants/storefront";
import IconButton from "../buttons/IconButton";
import PrimaryButton from "../buttons/PrimaryButton";
import type { StorefrontProduct } from "@/constants/storefront";

export interface ProductCardProps {
  product: StorefrontProduct;
  type?: "product" | "wishlist" | "cart";
  isWishlisted?: boolean;
  onWishlistClick?: () => void;
  onButtonClick?: () => void;
  setSelectedWeight?: React.Dispatch<
    React.SetStateAction<Record<string | number, string>>
  >;
  actions?: {
    decreaseQuantity?: (id: number, weight?: string) => void;
    increaseQuantity?: (id: number, weight?: string) => void;
  };
  quantity?: number;
}

export function ProductCard({
  product,
  type = "product",
  isWishlisted = false,
  onWishlistClick,
  onButtonClick,
  setSelectedWeight,
  actions,
  quantity = 1,
}: ProductCardProps) {
  const isCart = type === "cart";
  const isProduct = type === "product";
  const isWishlist = type === "wishlist";

  const wishlistIcon = isWishlisted ? ICONS.wishlist_red : ICONS.wishlist;
  const weights = ["50g", "100g"];

  return (
    <div
      className="
        group
        bg-white
        rounded-xl
        border
        border-gray-200
        p-2
        sm:p-4
        transition-all
        duration-300
        flex
        flex-col
        justify-between
        cursor-pointer
        hover:border-[var(--brown-700)]
        hover:shadow-xl
        hover:-translate-y-2
      "
    >
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={product.image}
          alt={product.productName}
          width={300}
          height={300}
          className="
            w-full
            h-[160px]
            sm:h-[200px]
            md:h-[260px]
            object-cover
            transition-transform
            duration-300
            group-hover:scale-105
          "
        />

        {/* Discount */}
        {product.discount > 0 && (
          <div
            className="
              absolute
              top-2
              left-2
              bg-red-600
              text-white
              text-[10px]
              font-semibold
              px-2
              py-1
              rounded-sm
            "
          >
            {product.discount}% OFF
          </div>
        )}

        {/* Wishlist */}
        {!isCart && onWishlistClick && (
          <IconButton
            icon={wishlistIcon}
            alt="wishlist"
            onClick={onWishlistClick}
            width={18}
            height={18}
            className="
              absolute
              top-2
              right-2
              h-8
              w-8
              rounded-full
              bg-white/60
              backdrop-blur-xs
              flex
              items-center
              justify-center
              hover:bg-white
            "
            imageClassName="w-[18px] h-[18px]"
          />
        )}
      </div>

      {/* Name + Weight */}
      <div className="flex mt-3 gap-2 justify-between items-start">
        <h3
          className="
            flex-1
            pr-2
            uppercase
            text-[11px]
            sm:text-[13px]
            md:text-[15px]
            font-semibold
            leading-4
            sm:leading-5
            transition-colors
            duration-300
            text-hover-primary
            text-[var(--brown-900)]
          "
        >
          {product.productName}
        </h3>

        <div className="flex flex-col items-end shrink-0">
          {isProduct && setSelectedWeight && (
            <div className="flex flex-wrap gap-1">
              {weights.map((weight) => (
                <button
                  key={weight}
                  type="button"
                  onClick={() =>
                    setSelectedWeight((prev) => ({
                      ...prev,
                      [product.productId]: weight,
                    }))
                  }
                  className={`
                    px-1
                    sm:px-2
                    py-[2px]
                    text-[9px]
                    sm:text-[10px]
                    font-medium
                    border
                    cursor-pointer
                    transition-all
                    duration-300
                    hover:scale-105
                    rounded-xs
                    ${
                      (product.activeWeight || "100g") === weight
                        ? "bg-[var(--brown-700)] text-white border-[var(--brown-700)]"
                        : "bg-white text-[var(--brown-700)] border-[var(--brown-700)]"
                    }
                  `}
                >
                  {weight}
                </button>
              ))}
            </div>
          )}

          {(isWishlist || isCart) && (
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              weight: <span className="font-medium ml-1">{product.activeWeight || "100g"}</span>
            </p>
          )}

          <div className="flex gap-2 mt-2 items-center">
            <p className="font-semibold text-[11px] sm:text-[13px] text-[var(--brown-900)]">
              ₹{isCart ? (product.price || 0) * quantity : product.price || product.price100g}.00
            </p>

            {(product.originalPrice || product.price100g) > (product.price || 0) && (
              <p className="text-gray-400 line-through text-[11px] sm:text-[12px]">
                ₹{isCart ? (product.originalPrice || 0) * quantity : product.originalPrice || product.price100g}.00
              </p>
            )}
          </div>
        </div>
      </div>

      {isCart && actions && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              actions.decreaseQuantity?.(product.productId, product.activeWeight)
            }
            className="h-7 w-7 rounded-md border text-xl cursor-pointer hover:bg-gray-100 transition flex items-center justify-center"
          >
            -
          </button>
          <span className="font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() =>
              actions.increaseQuantity?.(product.productId, product.activeWeight)
            }
            className="h-7 w-7 rounded-md border text-xl cursor-pointer hover:bg-gray-100 transition flex items-center justify-center"
          >
            +
          </button>
        </div>
      )}

      {/* Button */}
      <div className="w-full flex justify-end mt-4">
        <PrimaryButton
          onClick={onButtonClick}
          variant="yellow"
          className="w-[80%] sm:w-[70%] block uppercase"
        >
          {isCart ? "Buy Now" : "Add To Cart"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default ProductCard;
