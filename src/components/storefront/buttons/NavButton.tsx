"use client";

import * as React from "react";
import Image from "next/image";

export interface NavButtonProps {
  text?: string;
  icon?: string;
  onClick?: () => void;
  variant?: "desktop" | "drawer" | "bottom";
  isActive?: boolean;
}

export function NavButton({
  text,
  icon,
  onClick,
  variant = "desktop",
  isActive = false,
}: NavButtonProps) {
  const variants = {
    desktop:
      "flex items-center gap-1 text-[15px] font-medium text-hover-primary hover:-translate-y-0.5",
    drawer:
      "flex w-full items-center justify-between px-6 py-4 text-white hover:bg-white/10",
    bottom:
      "flex flex-col-reverse items-center gap-1 text-[13px] font-medium hover:scale-105",
  };

  const activeClass = isActive
    ? variant === "drawer"
      ? "drawer-active"
      : ""
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group transition-all duration-150 cursor-pointer active:scale-95
        ${variants[variant]}
        ${activeClass}
      `}
    >
      {text && <span>{text}</span>}

      {icon && (
        <Image
          src={icon}
          alt={text || "nav icon"}
          width={variant === "bottom" ? 16 : variant === "drawer" ? 16 : 12}
          height={variant === "bottom" ? 16 : variant === "drawer" ? 16 : 12}
          className={`transition-transform duration-300 ${
            variant === "bottom"
              ? "group-hover:scale-110"
              : "group-hover:rotate-180"
          }`}
        />
      )}
    </button>
  );
}

export default NavButton;
