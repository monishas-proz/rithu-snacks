"use client";

import * as React from "react";
import Image from "next/image";
import { X, Play } from "lucide-react";
import { createPortal } from "react-dom";
import { useCustomerBanners } from "@/features/banners/hooks";
import type { CustomerBannerDto } from "@/features/banners/types";

function ReelPlayerModal({
  reel,
  onClose,
}: {
  reel: CustomerBannerDto;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm aspect-[9/16]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-lg hover:text-neutral-900 cursor-pointer"
          aria-label="Close reel"
        >
          <X className="h-5 w-5" />
        </button>

        <video
          src={reel.videoUrl ?? undefined}
          poster={reel.imageUrl}
          className="h-full w-full rounded-2xl object-cover bg-black"
          controls
          autoPlay
          playsInline
        />

        {reel.linkUrl && (
          <a
            href={reel.linkUrl}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900 shadow-lg"
          >
            Shop This
          </a>
        )}
      </div>
    </div>,
    document.body
  );
}

export function OfferReels() {
  const { data: reels } = useCustomerBanners({ position: "home-reels" });
  const [activeReel, setActiveReel] = React.useState<CustomerBannerDto | null>(
    null
  );

  const videoReels = React.useMemo(
    () => (reels ?? []).filter((r) => r.mediaType === "video" && r.videoUrl),
    [reels]
  );

  if (videoReels.length === 0) return null;

  return (
    <section className="w-full py-4">
      <h2 className="px-4 mb-3 text-lg font-bold text-[var(--color-neutral-900)]">
        Offer Reels
      </h2>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin">
        {videoReels.map((reel) => (
          <button
            key={reel.id}
            type="button"
            onClick={() => setActiveReel(reel)}
            className="relative flex-shrink-0 w-28 aspect-[9/16] overflow-hidden rounded-2xl ring-2 ring-[var(--color-secondary-500)] cursor-pointer"
          >
            <Image
              src={reel.imageUrl}
              alt={reel.title || "Offer reel"}
              fill
              className="object-cover"
              sizes="112px"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-8 w-8 text-white drop-shadow" fill="white" />
            </div>
            {reel.title && (
              <p className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-xs font-medium text-white drop-shadow">
                {reel.title}
              </p>
            )}
          </button>
        ))}
      </div>

      {activeReel && (
        <ReelPlayerModal reel={activeReel} onClose={() => setActiveReel(null)} />
      )}
    </section>
  );
}

export default OfferReels;
