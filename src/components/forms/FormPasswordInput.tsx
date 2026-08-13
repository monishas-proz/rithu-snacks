"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FormPasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  name: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

function FormPasswordInput({
  name,
  label,
  helperText,
  leftIcon,
  className,
  ...props
}: FormPasswordInputProps) {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-1.5">
          {label && <Label htmlFor={name}>{label}</Label>}

          <div className="relative">
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {leftIcon}
              </div>
            )}

            <input
              id={name}
              {...field}
              {...props}
              type={showPassword ? "text" : "password"}
              className={cn(
                "flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm",
                leftIcon && "pl-10",
                "transition-colors duration-200",
                "placeholder:text-gray-500",
                fieldState.error
                  ? "border-error-600"
                  : "border-gray-300 hover:border-gray-400",
                className
              )}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>

          {fieldState.error && (
            <p className="text-sm text-red-500">
              {fieldState.error.message}
            </p>
          )}

          {!fieldState.error && helperText && (
            <p className="text-sm text-gray-500">
              {helperText}
            </p>
          )}
        </div>
      )}
    />
  );
}

export { FormPasswordInput };