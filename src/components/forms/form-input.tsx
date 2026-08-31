"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "./label";

export function formatSlug(val: string): string {
  return val.toUpperCase().replace(/[^A-Z0-9_]/g, "");
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputPrefix?: React.ReactNode;
  isSlug?: boolean;
}

function FormInput({
  name,
  label,
  description,
  className,
  leftIcon,
  rightIcon,
  inputPrefix,
  isSlug,
  ...props
}: FormInputProps) {
  const { control } = useFormContext();
  const isSlugField =
    isSlug ?? (name === "slug" || name.toLowerCase().endsWith("slug"));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="pt-0 mb-3">
          {label && <Label htmlFor={name}>{label}</Label>}
          <Input
            id={name}
            {...props}
            value={field.value ?? ""}
            onChange={(e) => {
              if (props.type === "number") {
                const value =
                  e.target.value === "" ? "" : Number(e.target.value);
                field.onChange(value);
                return;
              }

              let value = e.target.value;
              if (isSlugField) {
                value = formatSlug(value);
              }

              field.onChange(value);
            }}
            onPaste={(e) => {
              if (isSlugField) {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                const formatted = formatSlug(pastedText);

                const input = e.currentTarget;
                const start = input.selectionStart ?? 0;
                const end = input.selectionEnd ?? 0;
                const currentValue = String(field.value || "");
                const nextValue = formatSlug(
                  currentValue.slice(0, start) +
                    formatted +
                    currentValue.slice(end)
                );

                field.onChange(nextValue);
              }
              props.onPaste?.(e);
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            className={className}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            inputPrefix={inputPrefix}
            error={fieldState.error?.message}
          />
          {description && !fieldState.error && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    />
  );
}

export { FormInput };
