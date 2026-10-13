"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogoWithText } from "@/components/ui/Logo";
import { useI18n } from "@/components/providers/I18nProvider";
import Link from "next/link";

function BgDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 animate-float" />
      <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full bg-white/5" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-16 right-1/4 w-3 h-3 rounded-full bg-white/20" />
      <div className="absolute bottom-1/3 left-12 w-2 h-2 rounded-full bg-white/30" />
    </div>
  );
}

export default function RegisterPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useI18n();

  const handleSendOtp = async () => {
    setError("");
    if (phone.length !== 10) {
      setError("10 digit number required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      router.push(`/verify-otp?phone=${phone}&mode=register`);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex flex-col items-center justify-center px-6 relative">
      <BgDecor />
      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="mb-10">
          <LogoWithText subtitle="Create new account" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-[28px] p-7 shadow-elevated animate-scale-in">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {t("auth.enter_phone")}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className={`w-full h-[56px] px-5 text-xl font-medium rounded-2xl bg-gray-50 border-2 ${
                  error ? "border-red-300" : "border-transparent focus:border-indigo-400"
                } outline-none transition-all placeholder:text-gray-300 tracking-wider`}
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            <Button onClick={handleSendOtp} loading={loading}>
              Send OTP
            </Button>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 uppercase">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center mt-4 text-gray-400 text-sm">
            {t("auth.already_registered")}{" "}
            <Link href="/login" className="text-indigo-600 font-bold">
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
