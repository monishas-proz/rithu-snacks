"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ICONS, banners } from "@/constants/storefront";
import { useSlider } from "@/hooks/useSlider";
import { useCustomerBanners } from "@/features/banners/hooks";
import { IconButton } from "./buttons/IconButton";

export function HeroSlider() {
  const { data: heroBanners } = useCustomerBanners({ position: "home-hero" });

  const slides = React.useMemo(() => {
    if (heroBanners && heroBanners.length > 0) {
      return heroBanners.map((banner) => ({
        key: banner.id,
        image: banner.imageUrl,
        link: banner.linkUrl,
        alt: banner.title || "Hero Banner",
      }));
    }
    return banners.map((image, index) => ({
      key: `fallback-${index}`,
      image,
      link: null as string | null,
      alt: "Hero Banner",
    }));
  }, [heroBanners]);

  const { currentIndex, next, previous } = useSlider(slides.length);
  const activeSlide = slides[currentIndex] ?? slides[0];

  if (!activeSlide) {
    return null;
  }

  const slideImage = (
    <Image
      src={activeSlide.image}
      alt={activeSlide.alt}
      width={1366}
      height={623}
      priority
      className="w-full h-auto block transition-all duration-500"
    />
  );

  return (
    <section className="relative w-full overflow-hidden">
      <IconButton
        icon={ICONS.leftButton}
        alt="Previous"
        onClick={previous}
        width={50}
        height={50}
        className="absolute left-1 sm:left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-10"
        imageClassName="w-6 sm:w-8 md:w-10 lg:w-12 h-auto"
      />

      {activeSlide.link ? (
        <Link href={activeSlide.link}>{slideImage}</Link>
      ) : (
        slideImage
      )}

      <IconButton
        icon={ICONS.leftButton}
        alt="Next"
        onClick={next}
        width={50}
        height={50}
        className="absolute right-1 sm:right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-10"
        imageClassName="w-6 sm:w-8 md:w-10 lg:w-12 h-auto rotate-180"
      />
    </section>
  );
}

export default HeroSlider;
