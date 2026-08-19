"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "./label";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputPrefix?: React.ReactNode;
}

function FormInput({
  name,
  label,
  description,
  className,
  leftIcon,
  rightIcon,
  inputPrefix,
  ...props
}: FormInputProps) {
  const { control } = useFormContext();

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
              const value =
                props.type === "number"
                  ? e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                  : e.target.value;

              field.onChange(value);
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
