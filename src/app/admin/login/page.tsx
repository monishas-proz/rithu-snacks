"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, LockKeyhole, AlertCircle } from "lucide-react";

import AuthBanner from "@/components/auth/AuthBanner";
import AuthFormLayout from "@/components/auth/AuthFormLayout";
import { FormInput } from "@/components/forms/form-input";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Checkbox } from "@/components/ui/checkbox";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
// import { loginUser } from "@/features/auth/services/auth.service";

function AdminLoginForm() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // const onSubmit = async (data: LoginInput) => {
  //   try {
  //     const result = await loginUser(data);

  //     if (result.success) {
  //       router.push("/admin/dashboard");
  //       router.refresh();
  //     } else {
  //       methods.setError("root", {
  //         type: "server",
  //         message: result.message || "Invalid email or password.",
  //       });
  //     }
  //   } catch (err: any) {
  //     methods.setError("root", {
  //       type: "server",
  //       message:
  //         err?.response?.data?.message ||
  //         "Something went wrong. Please try again later.",
  //     });
  //   }
  // };

  return (
    <AuthFormLayout
      showLogo
      showFooter
      title="Welcome back"
      subtitle="Enter your credentials to access the RithuSnacks admin portal."
    >
      <FormProvider {...methods}>
        <form
          // onSubmit={methods.handleSubmit(onSubmit)}
          className="space-y-5 md:space-y-6"
        >
          {/* Server Error */}
          {methods.formState.errors.root?.message && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {methods.formState.errors.root.message}
            </div>
          )}

          <FormInput
            name="email"
            label="Email Address"
            type="email"
            placeholder="admin@rithusnacks.com"
            autoComplete="email"
            leftIcon={<Mail size={18} />}
          />

          <FormInput
            name="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            leftIcon={<LockKeyhole size={18} />}
          />

          <div className="flex items-center justify-between">
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              label="Remember me"
              className="border-neutral-300"
            />

            <Link
              href="/admin/forgot-password"
              className="text-sm font-medium text-secondary-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <FormSubmitButton
            size="xl"
            className="mt-2 h-10 w-full rounded-lg bg-secondary-600 text-sm text-white transition-all hover:bg-secondary-700 cursor-pointer"
          >
            Sign In to Admin
          </FormSubmitButton>
        </form>
      </FormProvider>
    </AuthFormLayout>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Banner */}
        <AuthBanner />

        {/* Right Form */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-8 lg:px-16">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}