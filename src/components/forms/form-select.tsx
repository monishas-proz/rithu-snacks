"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Select, type SelectOption } from "@/components/ui/select";
import { Label } from "./label";

interface FormSelectProps {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
}

function FormSelect({
  name,
  label,
  options,
  placeholder,
  description,
}: FormSelectProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          {label && <Label>{label}</Label>}
          <Select
            {...field}
            options={options}
            placeholder={placeholder}
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

export { FormSelect };
