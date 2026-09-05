"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

export interface IconButtonProps {
  icon: string;
  alt: string;
  href?: string;
  onClick?: () => void;
  badge?: number | null;
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
}

export function IconButton({
  icon,
  alt,
  href,
  onClick,
  badge,
  className = "",
  imageClassName = "",
  width = 18,
  height = 18,
}: IconButtonProps) {
  const content = (
    <>
      <Image
        src={icon}
        alt={alt}
        width={width}
        height={height}
        className={imageClassName}
      />
      {badge !== undefined && badge !== null && badge > 0 ? (
        <span className="absolute -top-2 -right-2 bg-theme-status-can-fg text-theme-primary-fg text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-xs pointer-events-none">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </>
  );

  const sharedClasses = `
    relative inline-flex items-center justify-center
    cursor-pointer
    hover:scale-110
    active:scale-90
    transition-transform
    duration-150
    ${className}
  `;

  if (href) {
    return (
      <Link href={href} className={sharedClasses} aria-label={alt} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClasses}
      aria-label={alt}
    >
      {content}
    </button>
  );
}

export default IconButton;
