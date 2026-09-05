"use client";

import * as React from "react";
import Link from "next/link";
import { useAutoSlider } from "@/hooks/useAutoSlider";
import { ICONS, CATEGORYLOGOS } from "@/constants/storefront";
import { SectionHeading } from "./heading/SectionHeading";
import { IconButton } from "./buttons/IconButton";
import { Section } from "./Section";
import { InfoCard } from "./cards/InfoCard";
import { useCustomerCategories, type CustomerCategoryDto } from "@/features/categories";
import { getImageUrl } from "@/lib/utils";

const fallbackCategoryLogos: Record<string, string> = {
  "flavors & spices": CATEGORYLOGOS.flavourSpices,
  "sweets": CATEGORYLOGOS.sweet,
  "healthy bites": CATEGORYLOGOS.bites,
  "traditional delights": CATEGORYLOGOS.traditional,
  "bakery": CATEGORYLOGOS.bakery,
  "chips": CATEGORYLOGOS.chips,
  "namkeen": CATEGORYLOGOS.flavourSpices,
  "snacks": CATEGORYLOGOS.traditional,
  "cakes": CATEGORYLOGOS.bakery,
};

function resolveCategoryImage(category: CustomerCategoryDto): string {
  if (category.image?.trim()) {
    return getImageUrl(category.image);
  }

  const normalizedName = category.name.trim().toLowerCase();
  return fallbackCategoryLogos[normalizedName] || CATEGORYLOGOS.traditional;
}

export function CategorySection() {
  const { data: response, isLoading } = useCustomerCategories({
    page: 1,
    pageSize: 20,
    sortBy: "name",
    sortOrder: "asc",
  });

  const { sliderRef, next, previous } = useAutoSlider(35);

  const rawCategories = response?.data;

  // Repeat categories to create continuous smooth auto-scrolling ticker
  const sliderCategories = React.useMemo(() => {
    const list = rawCategories || [];
    if (list.length === 0) return [];
    if (list.length < 4) {
      return [
        ...list,
        ...list,
        ...list,
        ...list,
        ...list,
        ...list,
      ];
    }
    return [
      ...list,
      ...list,
      ...list,
      ...list,
    ];
  }, [rawCategories]);

  return (
    <Section>
      <SectionHeading title="Explore by category" />

      {/* Slider */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Left Button */}
        <IconButton
          icon={ICONS.rightButton}
          alt="Left"
          onClick={previous}
          width={70}
          height={70}
          className="h-8 w-8 rounded flex items-center justify-center shrink-0"
          imageClassName="w-full h-auto rotate-180"
        />

        {/* Categories Carousel */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex w-max gap-5 whitespace-nowrap">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex flex-col items-center shrink-0 animate-pulse"
                >
                  <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-36 lg:w-36 rounded-full bg-gray-200" />
                  <div className="mt-3 h-4 w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : sliderCategories.length > 0 ? (
            <div
              ref={sliderRef}
              className="flex w-max gap-5 whitespace-nowrap"
            >
              {sliderCategories.map((category, index) => {
                const imageUrl = resolveCategoryImage(category);

                return (
                  <Link
                    key={`${category.id}-${index}`}
                    href={`/categories/${category.id}`}
                    className="block cursor-pointer transition-transform duration-300 hover:scale-105"
                  >
                    <InfoCard
                      image={imageUrl}
                      alt={category.name}
                      title={category.name}
                      cardClassName="
                        flex
                        flex-col
                        items-center
                        shrink-0
                      "
                      imageWrapperClassName="
                        h-20
                        w-20
                        sm:h-24
                        sm:w-24
                        md:h-28
                        md:w-28
                        lg:h-36
                        lg:w-36
                        rounded-full
                        overflow-hidden
                        transition-all
                        duration-300
                        group-hover:shadow-xl
                        group-hover:-translate-y-2
                        bg-white
                        flex
                        items-center
                        justify-center
                      "
                      imageClassName="
                        object-contain
                        transition-transform
                        duration-300
                        group-hover:scale-110
                      "
                      titleClassName="
                        mt-3
                        text-center
                        text-xs
                        sm:text-sm
                        md:text-base
                        font-medium
                        transition-colors
                        duration-300
                        text-hover-primary
                        text-[var(--brown-800)]
                      "
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[var(--color-neutral-500)]">
              No categories available at the moment.
            </div>
          )}
        </div>

        {/* Right Button */}
        <IconButton
          icon={ICONS.rightButton}
          alt="Right"
          onClick={next}
          width={70}
          height={70}
          className="
            h-7
            w-7
            md:h-8
            md:w-8
            rounded
            flex
            items-center
            justify-center
            shrink-0
          "
          imageClassName="w-full h-auto"
        />
      </div>
    </Section>
  );
}

export default CategorySection;
