"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { AlertCircle, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
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
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2 self-start"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to home
          </Link>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
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

              <FormInput
                name="email"
                label="Email Address"
                type="email"
                placeholder="admin@rithusnacks.com"
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
        </CardContent>
      </Card>
    </div>
  );
}
