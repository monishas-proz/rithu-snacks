"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
  fallbackClassName?: string;
}

const ImageWithFallback = React.forwardRef<HTMLDivElement, ImageWithFallbackProps>(
  ({ src, alt = "", className, fallbackClassName, ...props }, ref) => {
    const [imgSrc, setImgSrc] = React.useState(src);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
      setImgSrc(src);
      setHasError(false);
    }, [src]);

    if (hasError || !imgSrc) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-center bg-gray-100 text-gray-400",
            className,
            fallbackClassName
          )}
          {...props}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("relative overflow-hidden", className)}>
        <img
          src={imgSrc}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
          loading="lazy"
          {...props}
        />
      </div>
    );
  }
);
ImageWithFallback.displayName = "ImageWithFallback";

export { ImageWithFallback };
export type { ImageWithFallbackProps };
