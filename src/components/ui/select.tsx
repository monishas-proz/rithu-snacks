"use client";

import * as React from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options = [],
      placeholder = "Select an option",
      error,
      disabled = false,
      value: controlledValue,
      defaultValue,
      onChange,
      name,
      id,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState<string>(
      (controlledValue !== undefined
        ? controlledValue
        : defaultValue !== undefined
        ? defaultValue
        : "") as string
    );
    const [searchQuery, setSearchQuery] = React.useState("");

    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const hiddenSelectRef = React.useRef<HTMLSelectElement | null>(null);

    // Sync controlled value if passed
    React.useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(String(controlledValue));
      }
    }, [controlledValue]);

    // Handle outside click
    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery("");
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (isOpen && options.length > 6) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }, [isOpen, options.length]);

    // Keyboard navigation (Escape to close)
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      } else if (e.key === "ArrowDown" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleSelectOption = (option: SelectOption) => {
      if (option.disabled || disabled) return;

      const newValue = option.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      setIsOpen(false);
      setSearchQuery("");

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = newValue;
        const changeEvent = new Event("change", { bubbles: true });
        hiddenSelectRef.current.dispatchEvent(changeEvent);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { name, value: newValue, id },
          currentTarget: { name, value: newValue, id },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) return options;
      const query = searchQuery.toLowerCase().trim();
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(query)
      );
    }, [options, searchQuery]);

    // Selected option label
    const selectedOption = options.find(
      (opt) => String(opt.value) === String(internalValue)
    );

    return (
      <div className="w-full relative" ref={containerRef} onKeyDown={handleKeyDown}>
        {/* Hidden Native Select for Form Libraries (e.g. react-hook-form) */}
        <select
          ref={(node) => {
            hiddenSelectRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
            }
          }}
          name={name}
          id={id}
          value={internalValue}
          onChange={onChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Select Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3.5 py-2 text-sm text-neutral-900 transition-all text-left cursor-pointer",
            "outline-none focus:outline-none focus:border-secondary-600 focus:ring-2 focus:ring-secondary-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600/20",
            isOpen
              ? "border-secondary-600 ring-2 ring-secondary-600/20"
              : "border-neutral-200 hover:border-neutral-300",
            error && "border-error-600 focus:border-error-600 focus:ring-error-600/20",
            disabled && "cursor-not-allowed bg-neutral-100 opacity-60 hover:border-neutral-200",
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span
            className={cn(
              "truncate font-normal",
              !selectedOption || selectedOption.value === ""
                ? "text-neutral-400"
                : "text-neutral-900"
            )}
          >
            {selectedOption && selectedOption.value !== ""
              ? selectedOption.label
              : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200",
              isOpen && "rotate-180 text-secondary-600"
            )}
          />
        </button>

        {/* Custom Dropdown List - Scrollable and Contained */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full z-[60] mt-1.5 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg animate-in zoom-in-95 duration-150"
            role="listbox"
          >
            {/* Search Input for Long Lists (>= 7 options) */}
            {options.length > 6 && (
              <div className="border-b border-neutral-100 p-2 bg-neutral-50/50">
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-xs text-neutral-800 placeholder:text-neutral-400 outline-none focus:outline-none focus:border-secondary-600 focus:ring-1 focus:ring-secondary-600/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Options Area */}
            <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-neutral-400">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected =
                    String(option.value) === String(internalValue) &&
                    option.value !== "";

                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectOption(option)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer select-none",
                        isSelected
                          ? "bg-secondary-50 font-medium text-secondary-900"
                          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
                        option.disabled &&
                          "cursor-not-allowed opacity-40 hover:bg-transparent pointer-events-none select-none"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-secondary-600" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };

