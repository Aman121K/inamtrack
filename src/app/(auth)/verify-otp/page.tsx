"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NumericKeypad } from "@/components/ui/NumericKeypad";
import { useI18n } from "@/components/providers/I18nProvider";


function BgDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 animate-float" />
      <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full bg-white/5" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-16 right-1/4 w-3 h-3 rounded-full bg-white/20" />
    </div>
  );
}

function VerifyOtpContent() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const phone = searchParams.get("phone") || "";
  const mode = searchParams.get("mode") || "register";

  const handleComplete = async (code: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error);
        setOtp("");
        return;
      }

      if (mode === "register") {
        router.push(`/set-pin?phone=${phone}`);
      } else if (data.data.hasPin) {
        router.push(`/login?phone=${phone}`);
      } else {
        router.push(`/set-pin?phone=${phone}`);
      }
    } catch {
      setError(t("common.error"));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex flex-col items-center justify-center px-6 relative">
      <BgDecor />
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white rounded-[28px] p-7 shadow-elevated animate-scale-in">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">{t("auth.enter_otp")}</p>
            <p className="text-gray-400 text-sm mt-1">{t("auth.otp_sent")} {phone}</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-2xl">
              {error}
            </p>
          )}

          <NumericKeypad
            value={otp}
            maxLength={6}
            onChange={setOtp}
            onComplete={handleComplete}
          />

          {loading && (
            <div className="mt-4 flex justify-center">
              <span className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-700" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
