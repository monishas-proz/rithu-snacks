"use client";

import * as React from "react";
import Image from "next/image";
import { LOGOS } from "@/constants/storefront";

export function Banner() {
  return (
    <div className="w-full">
      <Image
        src={LOGOS.banner}
        alt="banner"
        width={1400}
        height={400}
        className="w-full h-auto"
      />
    </div>
  );
}

export default Banner;
