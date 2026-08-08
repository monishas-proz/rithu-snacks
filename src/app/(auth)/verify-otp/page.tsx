"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function VerifyOtpForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(59);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const newOtp = [...otp];

    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });

    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = () => {
    const code = otp.join("");
    console.log("OTP:", code);
  };

  const handleResend = () => {
    setTimeLeft(59);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-[300px] xs:max-w-[320px] sm:max-w-[360px] lg:max-w-[500px]">
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.svg"
            alt="Rithu Snacks"
            width={64}
            height={64}
            className="h-12 w-12 sm:h-14 sm:w-14"
            priority
          />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1
            className="text-[32px] font-bold text-neutral-900 sm:text-[38px]"
            style={{ fontFamily: "var(--font-hanken)" }}
          >
            Verify Account
          </h1>

          <p className="mt-3 text-[15px] leading-7 text-neutral-600 sm:text-base">
            We&apos;ve sent a 6-digit code to your email.
          </p>
        </div>
        
        {/* OTP Inputs */}
        <div className="mt-8 sm:mt-10">
          <div className="grid grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                inputMode="numeric"
                maxLength={1}
                className="
                  aspect-square
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  text-center
                  text-base
                  sm:text-lg
                  md:text-xl
                  font-semibold
                  text-neutral-900
                  outline-none
                  transition-all
                  focus:border-secondary-600
                  focus:ring-2
                  focus:ring-secondary-600/20
                "
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Resend in{" "}
            <span className="font-medium text-neutral-900">
              00:{timeLeft.toString().padStart(2, "0")}
            </span>
          </span>

          <button
            type="button"
            onClick={handleResend}
            disabled={timeLeft !== 0}
            className={`font-medium transition-colors ${
              timeLeft === 0
                ? "text-secondary-600 hover:underline"
                : "cursor-not-allowed text-neutral-400"
            }`}
          >
            Resend OTP
          </button>
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          className="mt-8 h-14 w-full rounded-xl bg-secondary-600 text-white hover:bg-secondary-700"
        >
          Verify
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Change Email */}
        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-secondary-600 hover:underline"
          >
            Change Email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}