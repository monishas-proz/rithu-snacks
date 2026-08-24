"use client";

import * as React from "react";
import Image from "next/image";
import { ICONS, banners } from "@/constants/storefront";
import { useSlider } from "@/hooks/useSlider";
import { IconButton } from "./buttons/IconButton";

export function HeroSlider() {
  const { currentIndex, next, previous } = useSlider(banners.length);

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

      <Image
        src={banners[currentIndex]}
        alt="Hero Banner"
        width={1366}
        height={623}
        priority
        className="w-full h-auto block transition-all duration-500"
      />

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
