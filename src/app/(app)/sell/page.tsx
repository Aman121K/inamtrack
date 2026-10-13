"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";

interface Batch {
  id: string;
  lotteryName: string;
  series: string;
  startNumber: number;
  endNumber: number;
  pricePerTicket: string;
  soldCount: number;
  ticketCount: number;
  drawDate: string;
}

interface CustomerSuggestion {
  id: string;
  name: string;
  phone: string;
}

function StepIndicator({ step }: { step: number }) {
  const steps = ["Batch", "Ticket", "Done"];
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
            i < step
              ? "bg-emerald-100 text-emerald-700"
              : i === step
              ? "bg-primary-gradient text-white shadow-sm"
              : "bg-gray-100 text-gray-400"
          }`}>
            {i < step ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
            {label}
          </div>
          {i < 2 && <div className={`w-4 h-0.5 ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function SellPage() {
  const { agent, isLoading } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { apiFetch } = useApi();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !agent) router.push("/login");
  }, [agent, isLoading, router]);

  useEffect(() => {
    if (agent) {
      apiFetch("/api/inventory?status=active").then(setBatches).catch(() => {});
    }
  }, [agent, apiFetch]);

  const searchCustomers = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const data = await apiFetch(`/api/customers?search=${query}`);
        setSuggestions(data);
      } catch {
        // ignore
      }
    },
    [apiFetch]
  );

  const handlePhoneChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 10);
    setCustomerPhone(clean);
    searchCustomers(clean);
  };

  const selectSuggestion = (s: CustomerSuggestion) => {
    setCustomerPhone(s.phone);
    setCustomerName(s.name);
    setSuggestions([]);
  };

  const handleSell = async () => {
    if (!selectedBatch || !ticketNumber || !customerPhone || !customerName) return;

    setLoading(true);
    try {
      await apiFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          batchId: selectedBatch.id,
          ticketNumber: parseInt(ticketNumber),
          customerName,
          customerPhone,
        }),
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setTicketNumber("");
        setCustomerPhone("");
        setCustomerName("");
        setSuggestions([]);
      }, 1500);

      apiFetch("/api/inventory?status=active").then(setBatches).catch(() => {});
    } catch (e) {
      showToast((e as Error).message || t("sell.sale_failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !agent) return null;

  const currentStep = !selectedBatch ? 0 : 1;

  return (
    <AppShell>
      <Header title={t("sell.title")} />
      <div className="px-4 py-4 space-y-4">
        <StepIndicator step={showSuccess ? 2 : currentStep} />

        {/* Success overlay */}
        {showSuccess && (
          <div className="text-center py-12 animate-success-pop">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-xl font-extrabold text-gray-900">Sale Done!</p>
            <p className="text-gray-400 text-sm mt-1">Ticket sold successfully</p>
          </div>
        )}

        {!showSuccess && !selectedBatch ? (
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {t("sell.select_batch")}
            </p>
            {batches.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">{t("common.no_data")}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  className="mt-3"
                  onClick={() => router.push("/inventory")}
                >
                  + {t("dashboard.add_stock")}
                </Button>
              </div>
            ) : (
              batches.map((batch, i) => (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatch(batch)}
                  className="w-full text-left p-4 bg-white rounded-2xl shadow-card active:shadow-none active:scale-[0.97] transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary-gradient flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {batch.series}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{batch.lotteryName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {batch.startNumber}-{batch.endNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-primary-600">₹{batch.pricePerTicket}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5 font-medium">
                        {batch.soldCount}/{batch.ticketCount} sold
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : !showSuccess ? (
          <div className="space-y-4 animate-fade-up">
            {/* Selected batch */}
            <button
              onClick={() => setSelectedBatch(null)}
              className="w-full text-left p-4 bg-primary-gradient rounded-2xl shadow-glow flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {selectedBatch!.series}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{selectedBatch!.lotteryName}</p>
                <p className="text-xs text-white/60 mt-0.5">₹{selectedBatch!.pricePerTicket} per ticket</p>
              </div>
              <span className="text-white/60 text-xs bg-white/10 px-3 py-1.5 rounded-full font-medium">
                {t("sell.change") || "Change"}
              </span>
            </button>

            {/* Ticket number */}
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {t("sell.ticket_number")}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder={`${selectedBatch!.startNumber} - ${selectedBatch!.endNumber}`}
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, ""))}
                className="w-full h-[52px] px-5 text-lg font-medium rounded-2xl bg-white border-2 border-transparent focus:border-indigo-400 outline-none shadow-card transition-all placeholder:text-gray-300 tracking-wider"
              />
            </div>

            {/* Customer phone */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {t("sell.customer_phone")}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full h-[52px] px-5 text-lg font-medium rounded-2xl bg-white border-2 border-transparent focus:border-indigo-400 outline-none shadow-card transition-all placeholder:text-gray-300 tracking-wider"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-2xl mt-1 shadow-elevated z-10 overflow-hidden border border-gray-50">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 active:bg-indigo-100 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customer name */}
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {t("sell.customer_name")}
              </label>
              <input
                type="text"
                placeholder="Raju Kumar"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-[52px] px-5 text-lg font-medium rounded-2xl bg-white border-2 border-transparent focus:border-indigo-400 outline-none shadow-card transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Total */}
            {selectedBatch && ticketNumber && (
              <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-between animate-fade-up">
                <span className="text-emerald-700 font-medium text-sm">Total Amount</span>
                <span className="text-emerald-700 font-extrabold text-xl">₹{selectedBatch.pricePerTicket}</span>
              </div>
            )}

            <Button
              onClick={handleSell}
              loading={loading}
              disabled={!ticketNumber || !customerPhone || !customerName}
            >
              {t("sell.sell_button")}
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
