"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { NumericKeypad } from "@/components/ui/NumericKeypad";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
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
      <div className="absolute top-1/3 left-1/4 w-4 h-4 rounded-full bg-white/10" />
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [step, setStep] = useState<"phone" | "pin">(
    searchParams.get("phone") ? "pin" : "phone"
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();

  const handlePinComplete = async (pinValue: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin: pinValue }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error);
        setPin("");
        return;
      }

      login(data.data.accessToken, data.data.refreshToken, data.data.agent);
      router.push("/dashboard");
    } catch {
      setError(t("common.error"));
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  if (step === "phone") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex flex-col items-center justify-center px-6 relative">
        <BgDecor />
        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-white shadow-elevated mb-5">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="12" width="36" height="24" rx="4" fill="#6366f1"/>
                <path d="M6 20h36" stroke="white" strokeWidth="2"/>
                <circle cx="16" cy="28" r="3" fill="white"/>
                <rect x="24" y="26" width="12" height="4" rx="2" fill="white" fillOpacity="0.5"/>
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">LotTrack</h1>
            <p className="text-white/50 text-sm mt-1">Lottery ticket management</p>
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

              <Button
                onClick={() => {
                  if (phone.length !== 10) {
                    setError("10 digit number required");
                    return;
                  }
                  setStep("pin");
                }}
              >
                Continue
              </Button>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300 uppercase">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <p className="text-center mt-4 text-gray-400 text-sm">
              {t("auth.new_user")}{" "}
              <Link href="/register" className="text-indigo-600 font-bold">
                {t("auth.register")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex flex-col items-center justify-center px-6 relative">
      <BgDecor />
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white rounded-[28px] p-7 shadow-elevated animate-scale-in">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">{t("auth.enter_pin")}</p>
            <p className="text-gray-400 text-sm mt-1">{phone}</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-2xl">
              {error}
            </p>
          )}

          <NumericKeypad
            value={pin}
            maxLength={4}
            onChange={setPin}
            onComplete={handlePinComplete}
            masked
          />

          {loading && (
            <div className="mt-4 flex justify-center">
              <span className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          )}

          <button
            onClick={() => { setStep("phone"); setPin(""); setError(""); }}
            className="mt-6 text-center w-full text-indigo-500 text-sm font-medium active:text-indigo-700"
          >
            ← Change number
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-700" />}>
      <LoginContent />
    </Suspense>
  );
}
