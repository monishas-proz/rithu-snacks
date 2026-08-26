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
  const [value, setValue] = React.useState(
    props.value !== undefined ? props.value : (props.defaultValue || "")
  );
  const onSearchRef = React.useRef(onSearch);

  React.useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
    }
  }, [props.value]);

  React.useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current?.(value as string);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn("h-11 rounded-xl border-neutral-300", value ? "pr-10" : "")}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            onSearchRef.current?.("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer p-1 z-10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { SearchInput };
