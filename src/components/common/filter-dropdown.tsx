"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
  className,
}: FilterDropdownProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
    </div>
  );
}

export { FilterDropdown };
