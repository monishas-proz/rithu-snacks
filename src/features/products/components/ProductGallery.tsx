"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import type { ProductDetail } from "../types";

interface ProductGalleryProps {
  images: ProductDetail["images"];
  productName: string;
  className?: string;
}

function ProductGallery({ images, productName, className }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={cn("aspect-square bg-muted rounded-lg flex items-center justify-center", className)}>
        <span className="text-muted-foreground">No Image Available</span>
      </div>
    );
  }

  const selected = images[selectedIndex];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <ImageWithFallback
          src={selected.url}
          alt={selected.altText || productName}
          className="h-full w-full"
        />
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={() => setSelectedIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={() => setSelectedIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                selectedIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <ImageWithFallback
                src={image.url}
                alt={image.altText || `${productName} ${index + 1}`}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { ProductGallery };
