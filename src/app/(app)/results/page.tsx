"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useApi } from "@/hooks/useApi";

interface ResultItem {
  id: string;
  lotteryName: string;
  drawDate: string;
  matched: boolean;
  winningNumbers: Array<{
    series: string;
    number: number;
    prize_tier: string;
    amount: number;
  }>;
}

export default function ResultsPage() {
  const { agent, isLoading } = useAuth();
  const { t } = useI18n();
  const { apiFetch } = useApi();
  const router = useRouter();
  const [results, setResults] = useState<ResultItem[]>([]);

  useEffect(() => {
    if (!isLoading && !agent) router.push("/login");
  }, [agent, isLoading, router]);

  useEffect(() => {
    if (agent) {
      apiFetch("/api/results")
        .then((d) => setResults(d?.results ?? []))
        .catch(() => {});
    }
  }, [agent, apiFetch]);

  if (isLoading || !agent) return null;

  return (
    <AppShell>
      <Header title={t("results.title")} />
      <div className="px-4 py-4 space-y-3">
        {results.map((result) => (
          <Card key={result.id}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{result.lotteryName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(result.drawDate).toLocaleDateString("hi-IN")}
                  </p>
                </div>
              </div>
              {result.matched && (
                <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Matched
                </span>
              )}
            </div>
            {result.winningNumbers.length > 0 && (
              <div className="space-y-1.5">
                {result.winningNumbers.slice(0, 5).map((w, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm bg-amber-50/60 px-3 py-2 rounded-xl"
                  >
                    <span className="font-mono font-medium text-gray-700">
                      {w.series}-{String(w.number).padStart(5, "0")}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      ₹{w.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
        {results.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-sm">{t("results.no_results")}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
