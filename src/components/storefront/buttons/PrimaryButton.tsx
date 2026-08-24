"use client";

import * as React from "react";

export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  variant?: "yellow" | "brown";
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
  variant = "yellow",
}: PrimaryButtonProps) {
  const variants = {
    yellow: "btn-yellow text-[var(--brown-900)]",
    brown: "btn-brown text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        h-[40px]
        font-semibold
        text-sm
        hover:scale-105
        active:scale-95
        transition-all
        duration-150
        cursor-pointer
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;
