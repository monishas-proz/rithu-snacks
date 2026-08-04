"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { apiClient } from "@/lib/api/api-client";
import { FormInput } from "@/components/forms/form-input";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const methods = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError("");
    setSuccess("");

    try {
      const result = await apiClient.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      if (result.success) {
        setSuccess("Account created successfully! Redirecting to sign in...");
        setTimeout(() => {
          const loginUrl = callbackUrl !== "/"
            ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "/login";
          router.push(loginUrl);
        }, 1500);
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 self-start"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to home
        </Link>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Join RithuSnacks and start shopping premium snacks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <FormInput
              name="name"
              label="Full Name"
              placeholder="John Doe"
              autoComplete="name"
            />

            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />

            <FormInput
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />

            <FormInput
              name="password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />

            <FormInput
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              autoComplete="new-password"
            />

            <FormSubmitButton className="w-full" isLoading={!!success}>
              Create Account
            </FormSubmitButton>
          </form>
        </FormProvider>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={
              callbackUrl !== "/"
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/login"
            }
            className="font-medium text-primary hover:underline"
          >
            Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
