"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "./label";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  description?: string;
}

function FormTextarea({
  name,
  label,
  description,
  className,
  ...props
}: FormTextareaProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          {label && <Label htmlFor={name}>{label}</Label>}
          <Textarea
            id={name}
            {...field}
            {...props}
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

export { FormTextarea };
