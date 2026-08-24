"use client";

import * as React from "react";
import Image from "next/image";

export interface IconButtonProps {
  icon: string;
  alt: string;
  onClick?: () => void;
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
}

export function IconButton({
  icon,
  alt,
  onClick,
  className = "",
  imageClassName = "",
  width = 18,
  height = 18,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        cursor-pointer
        hover:scale-110
        active:scale-90
        transition-transform
        duration-150
        ${className}
      `}
      aria-label={alt}
    >
      <Image
        src={icon}
        alt={alt}
        width={width}
        height={height}
        className={imageClassName}
      />
    </button>
  );
}

export default IconButton;
