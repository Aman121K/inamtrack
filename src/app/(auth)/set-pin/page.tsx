"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumericKeypad } from "@/components/ui/NumericKeypad";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";


function BgDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 animate-float" />
      <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full bg-white/5" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5 animate-float" style={{ animationDelay: "2s" }} />
    </div>
  );
}

function SetPinContent() {
  const [step, setStep] = useState<"info" | "pin" | "confirm">("info");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useI18n();

  const phone = searchParams.get("phone") || "";

  const handlePinSet = (value: string) => {
    setPin(value);
    if (value.length === 4) {
      setStep("confirm");
    }
  };

  const handleConfirmComplete = async (value: string) => {
    if (value !== pin) {
      setError("PIN doesn't match");
      setConfirmPin("");
      setStep("pin");
      setPin("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/set-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, pin, city: city || undefined }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error);
        setConfirmPin("");
        return;
      }

      login(data.data.accessToken, data.data.refreshToken, data.data.agent);
      router.push("/dashboard");
    } catch {
      setError(t("common.error"));
      setConfirmPin("");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Your Info", "Set PIN", "Confirm"];
  const stepIndex = step === "info" ? 0 : step === "pin" ? 1 : 2;

  if (step === "info") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex flex-col items-center justify-center px-6 relative">
        <BgDecor />
        <div className="w-full max-w-sm relative z-10">
          <div className="bg-white rounded-[28px] p-7 shadow-elevated animate-scale-in">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= stepIndex ? "bg-primary-gradient text-white shadow-glow" : "bg-gray-100 text-gray-400"
                  }`}>
                    {i + 1}
                  </div>
                  {i < 2 && <div className={`w-6 h-0.5 ${i < stepIndex ? "bg-indigo-400" : "bg-gray-100"}`} />}
                </div>
              ))}
            </div>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900">{t("auth.register")}</p>
            </div>

            <div className="space-y-4">
              <Input
                label={t("auth.enter_name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sanjay Kumar"
              />

              <Input
                label={t("auth.enter_city")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ludhiana"
              />

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-2xl">
                  {error}
                </p>
              )}

              <Button
                onClick={() => {
                  if (!name.trim()) {
                    setError("Name required");
                    return;
                  }
                  setStep("pin");
                }}
              >
                Next
              </Button>
            </div>
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
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= stepIndex ? "bg-primary-gradient text-white shadow-glow" : "bg-gray-100 text-gray-400"
                }`}>
                  {i <= stepIndex - 1 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className={`w-6 h-0.5 ${i < stepIndex ? "bg-indigo-400" : "bg-gray-100"}`} />}
              </div>
            ))}
          </div>

          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-2xl">
              {error}
            </p>
          )}

          {step === "pin" ? (
            <NumericKeypad
              label={t("auth.set_pin")}
              value={pin}
              maxLength={4}
              onChange={setPin}
              onComplete={handlePinSet}
              masked
            />
          ) : (
            <NumericKeypad
              label={t("auth.confirm_pin")}
              value={confirmPin}
              maxLength={4}
              onChange={setConfirmPin}
              onComplete={handleConfirmComplete}
              masked
            />
          )}

          {loading && (
            <div className="mt-4 flex justify-center">
              <span className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          )}

          <button
            onClick={() => {
              if (step === "confirm") {
                setStep("pin");
                setPin("");
                setConfirmPin("");
              } else {
                setStep("info");
                setPin("");
              }
              setError("");
            }}
            className="mt-6 text-center w-full text-indigo-500 text-sm font-medium active:text-indigo-700"
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetPinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-700" />}>
      <SetPinContent />
    </Suspense>
  );
}
