"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NumericKeypad } from "@/components/ui/NumericKeypad";
import { LogoWithText } from "@/components/ui/Logo";
import { useI18n } from "@/components/providers/I18nProvider";
import Link from "next/link";

function BgDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 animate-float" />
      <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full bg-white/5" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5 animate-float" style={{ animationDelay: "2s" }} />
    </div>
  );
}

export default function RequestAccessPage() {
  const [step, setStep] = useState<"info" | "pin" | "confirm" | "done">("info");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const handleInfoNext = () => {
    setError("");
    if (name.trim().length < 2) {
      setError(t("auth.name_required"));
      return;
    }
    if (phone.length !== 10) {
      setError(t("auth.phone_required"));
      return;
    }
    setStep("pin");
  };

  const handlePinSet = (value: string) => {
    setPin(value);
    if (value.length === 4) setStep("confirm");
  };

  const handleConfirmComplete = async (value: string) => {
    if (value !== pin) {
      setError(t("auth.pin_mismatch"));
      setConfirmPin("");
      setPin("");
      setStep("pin");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, pin, city: city || undefined }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        setStep("info");
        setPin("");
        setConfirmPin("");
        return;
      }
      setStep("done");
    } catch {
      setError(t("common.error"));
      setStep("info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 flex flex-col items-center justify-center px-6 py-10 relative">
      <BgDecor />
      <div className="w-full max-w-sm relative z-10">
        <div className="mb-8">
          <LogoWithText subtitle={t("auth.request_subtitle")} />
        </div>

        <div className="bg-white rounded-[28px] p-7 shadow-elevated animate-scale-in">
          {step === "info" && (
            <div className="space-y-4">
              <p className="text-lg font-bold text-gray-900 text-center">
                {t("auth.request_title")}
              </p>
              <Input
                label={t("auth.enter_name")}
                placeholder="Gurpreet Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                  {t("auth.enter_phone")}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full h-14 px-4 text-lg rounded-btn bg-white shadow-card border border-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-gray-300 tracking-wider"
                />
              </div>
              <Input
                label={t("auth.enter_city")}
                placeholder="Ludhiana"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {error && (
                <p className="text-sm text-danger-600 text-center bg-red-50 p-2.5 rounded-xl">
                  {error}
                </p>
              )}
              <Button onClick={handleInfoNext}>{t("common.next")}</Button>
            </div>
          )}

          {step === "pin" && (
            <div>
              <div className="text-center mb-5">
                <p className="text-lg font-bold text-gray-900">{t("auth.set_pin")}</p>
                <p className="text-gray-400 text-sm mt-1">{t("auth.pin_hint")}</p>
              </div>
              <NumericKeypad value={pin} maxLength={4} onChange={handlePinSet} masked />
              <button
                onClick={() => { setStep("info"); setPin(""); setError(""); }}
                className="mt-6 text-center w-full text-indigo-500 text-sm font-medium active:text-indigo-700"
              >
                ← {t("common.back")}
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div>
              <div className="text-center mb-5">
                <p className="text-lg font-bold text-gray-900">{t("auth.confirm_pin")}</p>
              </div>
              {error && (
                <p className="text-danger-600 text-sm mb-4 text-center bg-red-50 p-3 rounded-2xl">
                  {error}
                </p>
              )}
              <NumericKeypad
                value={confirmPin}
                maxLength={4}
                onChange={setConfirmPin}
                onComplete={handleConfirmComplete}
                masked
              />
              {loading && (
                <div className="mt-4 flex justify-center">
                  <span className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900">{t("auth.request_sent_title")}</p>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {t("auth.request_sent_msg")}
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push("/login")}>{t("auth.go_to_login")}</Button>
              </div>
            </div>
          )}

          {step === "info" && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
