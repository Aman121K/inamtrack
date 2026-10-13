"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useApi } from "@/hooks/useApi";

interface DashboardStats {
  todaySales: number;
  totalTickets: number;
  soldTickets: number;
  pendingResults: number;
  totalWinners: number;
  totalCustomers: number;
  todayRevenue?: number;
  recentSales?: { id: string; customerName: string; lotteryName: string; ticketNumber: string; amount: string; time: string }[];
}

function StatCard({
  value,
  label,
  gradient,
  icon,
  delay,
}: {
  value: string;
  label: string;
  gradient: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className={`${gradient} rounded-2xl p-4 text-white shadow-card animate-fade-up relative overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="relative">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
          {icon}
        </div>
        <p className="text-[28px] font-extrabold leading-none">{value}</p>
        <p className="text-white/70 text-[11px] mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  label,
  onClick,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 text-center shadow-card active:scale-[0.96] active:shadow-none transition-all duration-200 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <span className="font-semibold text-[13px] text-gray-700 block">{label}</span>
    </button>
  );
}

export default function DashboardPage() {
  const { agent, isLoading } = useAuth();
  const { t } = useI18n();
  const { apiFetch } = useApi();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!isLoading && !agent) {
      router.push("/login");
    }
  }, [agent, isLoading, router]);

  useEffect(() => {
    if (agent) {
      apiFetch("/api/dashboard").then(setStats).catch(() => {});
    }
  }, [agent, apiFetch]);

  if (isLoading || !agent) return null;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const revenue = stats?.todayRevenue ?? (stats ? stats.todaySales * 200 : 0);

  return (
    <AppShell>
      {/* Greeting Header */}
      <div className="bg-primary-gradient px-4 pt-5 pb-10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute left-1/4 -bottom-6 w-24 h-24 rounded-full bg-white/5" />

        <div className="max-w-lg mx-auto relative">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-white/50 text-xs font-medium">{dateStr}</p>
              <p className="text-white/70 text-sm mt-0.5">{t("dashboard.welcome")}</p>
              <h1 className="text-[22px] font-extrabold text-white tracking-tight">{agent.name}</h1>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-lg shadow-lg">
              {agent.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Revenue highlight */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium">Today&apos;s Earnings</p>
              <p className="text-white text-2xl font-extrabold mt-0.5">
                ₹{revenue.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-5 max-w-lg mx-auto pb-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            value={String(stats?.todaySales ?? "0")}
            label={t("dashboard.today_sales")}
            gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
            delay={0}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
          <StatCard
            value={stats ? `${stats.soldTickets}/${stats.totalTickets}` : "0"}
            label={t("dashboard.sold_tickets")}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={50}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" />
              </svg>
            }
          />
          <StatCard
            value={String(stats?.pendingResults ?? "0")}
            label={t("dashboard.pending_results")}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={100}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <StatCard
            value={String(stats?.totalWinners ?? "0")}
            label={t("dashboard.winners")}
            gradient="bg-gradient-to-br from-rose-500 to-pink-600"
            delay={150}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-widest">{t("dashboard.quick_actions")}</p>
          <div className="grid grid-cols-4 gap-2.5">
            <ActionCard
              label={t("dashboard.quick_sell")}
              onClick={() => router.push("/sell")}
              delay={200}
              icon={
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" />
                  </svg>
                </div>
              }
            />
            <ActionCard
              label={t("dashboard.add_stock")}
              onClick={() => router.push("/inventory")}
              delay={250}
              icon={
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
              }
            />
            <ActionCard
              label="Results"
              onClick={() => router.push("/results")}
              delay={300}
              icon={
                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                </div>
              }
            />
            <ActionCard
              label="Customers"
              onClick={() => router.push("/customers")}
              delay={350}
              icon={
                <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
              }
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="animate-fade-up" style={{ animationDelay: "400ms" }}>
          <p className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Recent Sales</p>
          {stats?.recentSales && stats.recentSales.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-card divide-y divide-gray-50 overflow-hidden">
              {stats.recentSales.slice(0, 4).map((sale) => (
                <div key={sale.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                    {sale.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{sale.customerName}</p>
                    <p className="text-gray-400 text-xs truncate">{sale.lotteryName} - {sale.ticketNumber}</p>
                  </div>
                  <p className="text-emerald-600 font-bold text-sm flex-shrink-0">₹{sale.amount}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No sales today</p>
              <button
                onClick={() => router.push("/sell")}
                className="mt-2 text-primary-600 text-sm font-semibold active:text-primary-800"
              >
                Make first sale →
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
