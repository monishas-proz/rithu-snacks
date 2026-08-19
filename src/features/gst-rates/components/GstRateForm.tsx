"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminGstRateSchema } from "../validations/admin-gst-rate.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import type { z } from "zod";

type GstRateFormData = z.infer<typeof createAdminGstRateSchema>;

interface GstRateFormProps {
  initialData?: Partial<GstRateFormData>;
  isEditing?: boolean;
  onSubmit: (data: GstRateFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function GstRateForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Save GST Rate",
}: GstRateFormProps) {
  const methods = useForm<GstRateFormData>({
    resolver: zodResolver(createAdminGstRateSchema),
    defaultValues: {
      name: initialData?.name || "",
      cgstPercent: initialData?.cgstPercent ?? 0,
      sgstPercent: initialData?.sgstPercent ?? 0,
      igstPercent: initialData?.igstPercent ?? 0,
    },
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(async (data) => {
          await onSubmit(data);
        })}
        className="space-y-6"
      >
        <FormInput
          name="name"
          label="GST Rate Name"
          placeholder="GST 18 Percent Standard"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormInput
            name="cgstPercent"
            label="CGST %"
            type="number"
            placeholder="9"
          />

          <FormInput
            name="sgstPercent"
            label="SGST %"
            type="number"
            placeholder="9"
          />

          <FormInput
            name="igstPercent"
            label="IGST %"
            type="number"
            placeholder="18"
          />
        </div>

        <div className="flex justify-end pt-4">
          <FormSubmitButton
            isLoading={isLoading}
            className="h-11 rounded-xl bg-[var(--color-secondary-600)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-secondary-700)]"
          >
            {submitLabel}
          </FormSubmitButton>
        </div>
      </form>
    </FormProvider>
  );
}