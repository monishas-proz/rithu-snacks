"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FormPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

const FormPasswordInput = React.forwardRef<HTMLInputElement, FormPasswordInputProps>(
  ({ className, label, error, helperText, disabled, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || `password-${generatedId}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <Label htmlFor={inputId}>
            {label}
          </Label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm",
              "transition-colors duration-200",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-gray-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-red-500 focus-visible:ring-red-500/30"
                : "border-gray-300 hover:border-gray-400",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormPasswordInput.displayName = "FormPasswordInput";

export { FormPasswordInput };
export type { FormPasswordInputProps };
