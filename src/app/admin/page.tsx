"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Icon } from "@/components/admin/icons";
import {
  Avatar,
  Panel,
  StatCard,
  inr,
  saleStatusBadge,
  timeAgo,
} from "@/components/admin/ui";
import { useAdmin } from "@/hooks/useAdmin";

interface Overview {
  totalAgents: number;
  pendingApprovals: number;
  activeAgents: number;
  totalLots: number;
  totalSales: number;
  totalRevenue: number;
  totalWinners: number;
  totalCustomers: number;
  today: { sales: number; revenue: number };
  trend: { date: string; sales: number; revenue: number }[];
  topAgents: { id: string; name: string; city: string | null; sales: number; revenue: number }[];
  recentSales: {
    id: string;
    ticket: string;
    amount: number;
    status: string;
    createdAt: string;
    customer: string;
    lottery: string;
    agent: { id: string; name: string };
  }[];
  recentPending: { id: string; name: string; phone: string; city: string | null; createdAt: string }[];
}

function RevenueChart({ trend }: { trend: Overview["trend"] }) {
  const max = Math.max(...trend.map((t) => t.revenue), 1);
  const total = trend.reduce((a, t) => a + t.revenue, 0);
  return (
    <div className="p-5">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-xs text-slate-500">Last 7 days</p>
          <p className="text-2xl font-bold text-slate-900">{inr(total)}</p>
        </div>
      </div>
      <div className="flex items-end gap-2 sm:gap-3 h-44">
        {trend.map((t) => {
          const h = Math.max(4, (t.revenue / max) * 100);
          const label = new Date(`${t.date}T00:00:00`).toLocaleDateString("en-IN", {
            weekday: "short",
          });
          return (
            <div key={t.date} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
              <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {inr(t.revenue)}
              </span>
              <div
                title={`${t.date}: ${t.sales} sales · ${inr(t.revenue)}`}
                className={`w-full rounded-t-lg transition-all ${
                  t.revenue > 0
                    ? "bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-700"
                    : "bg-slate-100"
                }`}
                style={{ height: `${h}%` }}
              />
              <span className="text-[11px] text-slate-500 font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { adminFetch } = useAdmin();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/admin/overview")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminFetch]);

  return (
    <AdminShell title="Overview" subtitle="Platform performance at a glance">
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-slate-400">Failed to load.</p>
      ) : (
        <div className="space-y-6">
          {data.pendingApprovals > 0 && (
            <Link
              href="/admin/approvals"
              className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Icon name="approvals" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900">
                  {data.pendingApprovals} agent{data.pendingApprovals > 1 ? "s" : ""} waiting for approval
                </p>
                <p className="text-xs text-amber-700">Review access requests</p>
              </div>
              <Icon name="arrowRight" size={18} className="text-amber-600" />
            </Link>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={inr(data.totalRevenue)} icon="rupee" tone="emerald" hint={`Today ${inr(data.today.revenue)}`} />
            <StatCard label="Total Sales" value={data.totalSales.toLocaleString("en-IN")} icon="sales" tone="indigo" hint={`Today ${data.today.sales}`} />
            <StatCard label="Active Agents" value={data.activeAgents} icon="agents" tone="sky" hint={`${data.totalAgents} registered`} />
            <StatCard label="Customers" value={data.totalCustomers.toLocaleString("en-IN")} icon="customers" tone="violet" />
            <StatCard label="Total Lots" value={data.totalLots} icon="lots" tone="amber" />
            <StatCard label="Winners" value={data.totalWinners} icon="results" tone="rose" />
            <StatCard label="Pending Approvals" value={data.pendingApprovals} icon="approvals" tone="amber" />
            <StatCard label="Registered Agents" value={data.totalAgents} icon="agents" tone="slate" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Panel title="Revenue trend" className="lg:col-span-2">
              <RevenueChart trend={data.trend} />
            </Panel>

            <Panel
              title="Top agents by revenue"
              action={
                <Link href="/admin/agents" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  View all
                </Link>
              }
            >
              {data.topAgents.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">No sales yet</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.topAgents.map((a, i) => (
                    <li key={a.id}>
                      <Link
                        href={`/admin/agents/${a.id}`}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                        <Avatar name={a.name} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{a.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {a.sales} sales{a.city ? ` · ${a.city}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-emerald-600">{inr(a.revenue)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Panel
              title="Recent sales"
              className="lg:col-span-2"
              action={
                <Link href="/admin/sales" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  View all
                </Link>
              }
            >
              {data.recentSales.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">No sales yet</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentSales.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Icon name="sales" size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {s.ticket} · {s.customer}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {s.lottery} ·{" "}
                          <Link href={`/admin/agents/${s.agent.id}`} className="hover:text-indigo-600">
                            {s.agent.name}
                          </Link>{" "}
                          · {timeAgo(s.createdAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">{inr(s.amount)}</p>
                        <div className="mt-0.5">{saleStatusBadge(s.status)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Pending requests"
              action={
                <Link href="/admin/approvals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Review
                </Link>
              }
            >
              {data.recentPending.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">All caught up 🎉</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentPending.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                      <Avatar name={p.name} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400">
                          +91 {p.phone}{p.city ? ` · ${p.city}` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400">{timeAgo(p.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
