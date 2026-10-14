"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useApi } from "@/hooks/useApi";

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  totalPurchases: number;
  totalWins: number;
  lastPurchaseAt: string | null;
}

export default function CustomersPage() {
  const { agent, isLoading } = useAuth();
  const { t } = useI18n();
  const { apiFetch } = useApi();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoading && !agent) router.push("/login");
  }, [agent, isLoading, router]);

  useEffect(() => {
    if (agent) {
      const query = search ? `?search=${search}` : "";
      apiFetch(`/api/customers${query}`)
        .then((d) => setCustomers(d?.customers ?? []))
        .catch(() => {});
    }
  }, [agent, apiFetch, search]);

  if (isLoading || !agent) return null;

  const colors = [
    "bg-primary-gradient",
    "bg-success-gradient",
    "bg-gold-gradient",
    "bg-gradient-to-br from-rose-500 to-pink-600",
    "bg-gradient-to-br from-cyan-500 to-blue-600",
  ];

  return (
    <AppShell>
      <Header title={t("customers.title")} />
      <div className="px-4 py-4 space-y-4">
        <div className="relative">
          <Input
            placeholder={`${t("common.search")}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
          <svg
            className="absolute left-4 top-[calc(50%)] -translate-y-1/2 text-gray-300"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="space-y-3">
          {customers.map((c, i) => (
            <Card key={c.id}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl ${colors[i % colors.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className="text-primary-600 font-bold">
                      {c.totalPurchases}
                    </span>{" "}
                    <span className="text-gray-300 text-xs">
                      {t("customers.purchases")}
                    </span>
                  </p>
                  {c.totalWins > 0 && (
                    <p className="text-xs text-emerald-600 font-bold mt-0.5">
                      <svg
                        className="inline w-3 h-3 mr-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                      {c.totalWins} {t("customers.wins")}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {customers.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-sm">{t("common.no_data")}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
