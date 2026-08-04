"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

function SearchInput({
  className,
  onSearch,
  debounceMs = 300,
  placeholder = "Search...",
  ...props
}: SearchInputProps) {
  const [value, setValue] = React.useState(props.defaultValue || "");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(value as string);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
      {value && (
        <button
          onClick={() => {
            setValue("");
            onSearch?.("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { SearchInput };
