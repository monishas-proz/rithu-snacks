"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
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
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
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
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
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

            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />

            <FormInput
              name="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <FormSubmitButton className="w-full">Sign In</FormSubmitButton>
          </form>
        </FormProvider>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={
              callbackUrl !== "/"
                ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/register"
            }
            className="font-medium text-primary hover:underline"
          >
            Register
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
