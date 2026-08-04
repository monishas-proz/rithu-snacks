"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const inputSizeClasses = {
    sm: "h-7 w-10 text-xs",
    md: "h-8 w-12 text-sm",
    lg: "h-10 w-14 text-base",
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={sizeClasses[size]}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val) && val >= min && val <= max) {
            onChange(val);
          }
        }}
        className={`${inputSizeClasses[size]} flex items-center justify-center rounded-md border bg-background text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        min={min}
        max={max}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={sizeClasses[size]}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

export { QuantitySelector };
