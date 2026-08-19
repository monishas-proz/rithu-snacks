"use client";
import { useMemo } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm,  } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthFormLayout from "@/components/auth/AuthFormLayout";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useRegister } from "@/features/auth";
import { FormInput } from "@/components/forms/form-input";
import { FormPasswordInput } from "@/components/forms/FormPasswordInput";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, LockKeyhole, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [success, setSuccess] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const registerMutation = useRegister();

  const methods = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = methods.watch("password") || "";

  const strength = useMemo(() => {
      if (!password) return null;
  
      let score = 0;
  
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
  
      if (score <= 2) {
        return {
          width: "25%",
          label: "Weak",
          color: "bg-error-600",
          suggestion:
            "Use at least 8 characters with uppercase, lowercase, a number, and a special character.",
        };
      }
  
      if (score === 3) {
        return {
          width: "50%",
          label: "Fair",
          color: "bg-primary-400",
          suggestion:
            "Add an uppercase letter, number, or special character.",
        };
      }
  
      if (score === 4) {
        return {
          width: "75%",
          label: "Good",
          color: "bg-success-500",
          suggestion:
            "Add a special character to make it stronger.",
        };
      }
  
      return {
        width: "100%",
        label: "Strong",
        color: "bg-success-600",
        suggestion: "Your password is strong.",
      };
    }, [password]);

  const onSubmit = (data: RegisterInput) => {
    setSuccess("");

    if (!acceptTerms) {
      methods.setError("root", {
        type: "manual",
        message: "Please accept Terms & Conditions.",
      });
      return;
    }

    registerMutation.mutate(
      {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: (res) => {
          setSuccess(res.message || "Account created successfully.");
          methods.reset({
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });

          setTimeout(() => {
            const loginUrl =
              callbackUrl !== "/"
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/login";
            router.push(loginUrl);
          }, 1500);
        },
      }
    );
  };

  return (
    <AuthFormLayout
      showLogo
      title="Create Account"
      subtitle="Welcome to Rithu&apos;s Snacks"
      bottomContent={
        <div className="text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            href={
              callbackUrl !== "/"
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/login"
            }
            className="font-medium text-secondary-600 hover:underline"
          >
            Sign In
          </Link>
        </div>
      }
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="space-y-5 md:space-y-6"
        >
          {/* Server Error */}
          {methods.formState.errors.root?.message && (
            <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {methods.formState.errors.root.message}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <FormInput
            name="name"
            label="Full Name"
            placeholder="Enter your full name"
            autoComplete="name"
            leftIcon={<User size={18} />}
          />

          <FormInput
            name="email"
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            leftIcon={<Mail size={18} />}
          />

          <FormInput
            name="phone"
            label="Mobile Number"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            autoComplete="tel"
            maxLength={10}
            leftIcon={<Phone size={18} />}
          />

          <FormPasswordInput
            name="password"
            label="Password"
            placeholder="Enter your password"
            leftIcon={<LockKeyhole size={18} />}
          />

          {password.length > 0 && strength && (
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  <span>Password Strength</span>
                  <span>{strength.label}</span>
                </div>

                <div className="h-[4px] w-full rounded-full bg-neutral-200">
                  <div
                    className={`h-[4px] rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>

                <p className="mt-2 text-xs text-neutral-500">
                  {strength.suggestion}
                </p>
              </div>
            )}

          <FormPasswordInput
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            leftIcon={<LockKeyhole size={18} />}
          />

          <div className="pt-1">
            <Checkbox
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              label={
                <>
                  I agree to the{" "}
                  <Link
                    href="/terms-and-conditions"
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-secondary-600 hover:underline"
                  >
                    Terms & Conditions
                  </Link>
                </>
              }
            />
          </div>

          <FormSubmitButton
            size="xl"
            disabled={registerMutation.isPending}
            className="mt-2 h-10 w-full rounded-lg bg-secondary-600 text-sm text-white transition-all hover:bg-secondary-700 cursor-pointer disabled:opacity-50"
          >
            {registerMutation.isPending ? <Spinner size="sm" className="text-white" /> : "Create Account"}
          </FormSubmitButton>
        </form>
      </FormProvider>
    </AuthFormLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}