"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { FormInput } from "@/components/forms/form-input";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api/api-client";

function ForgotPasswordForm() {
  const [success, setSuccess] = useState("");

  const methods = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setSuccess("");

    try {
      const result = await apiClient.post("/api/auth/forgot-password", {
        email: data.email.trim(),
      });

      if (result.success) {
        setSuccess("OTP has been sent to your email address.");
        methods.reset();
      } else {
        methods.setError("root", {
          type: "server",
          message: result.message || "Failed to send OTP.",
        });
      }
    } catch (err: any) {
      methods.setError("root", {
        type: "server",
        message:
          err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[300px] xs:max-w-[320px] sm:max-w-[360px] lg:max-w-[500px]">
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        {/* Heading */}
        <div>
          <h1
            className="text-[30px] font-bold leading-tight text-neutral-900 sm:text-[34px]"
            style={{ fontFamily: "var(--font-hanken)" }}
          >
            Forgot Password?
          </h1>

          <p className="mt-3 text-[15px] leading-7 text-neutral-600">
            Enter your registered email address and we&apos;ll send you a
            one-time password (OTP) to reset your account.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Server Error */}
        {methods.formState.errors.root?.message && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {methods.formState.errors.root.message}
          </div>
        )}

        {/* Form */}
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="mt-8 space-y-6"
          >
            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="hello@example.com"
              autoComplete="email"
              leftIcon={<Mail size={18} />}
            />

            <FormSubmitButton
              size="xl"
              className="h-12 w-full rounded-lg bg-secondary-600 text-sm font-semibold text-white hover:bg-secondary-700"
            >
              Send OTP
            </FormSubmitButton>
          </form>
        </FormProvider>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-secondary-600"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}