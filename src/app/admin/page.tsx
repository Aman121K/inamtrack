"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/ui/Spinner";
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
}

function StatCard({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-full">
      <div className={`w-2 h-2 rounded-full ${accent} mb-3`} />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
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
    <AdminShell title="Overview" subtitle="Platform summary">
      {loading ? (
        <PageLoader />
      ) : data ? (
        <>
          {data.pendingApprovals > 0 && (
            <Link
              href="/admin/approvals"
              className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5"
            >
              <div>
                <p className="font-bold text-amber-900">
                  {data.pendingApprovals} agent{data.pendingApprovals > 1 ? "s" : ""} waiting for approval
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Tap to review requests →</p>
              </div>
              <span className="text-2xl font-bold text-amber-600">{data.pendingApprovals}</span>
            </Link>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Agents" value={data.totalAgents} accent="bg-indigo-500" href="/admin/agents" />
            <StatCard label="Active Agents" value={data.activeAgents} accent="bg-emerald-500" href="/admin/agents" />
            <StatCard label="Pending Approvals" value={data.pendingApprovals} accent="bg-amber-500" href="/admin/approvals" />
            <StatCard label="Total Lots" value={data.totalLots} accent="bg-purple-500" href="/admin/lots" />
            <StatCard label="Total Sales" value={data.totalSales} accent="bg-cyan-500" />
            <StatCard label="Total Revenue" value={`₹${data.totalRevenue.toLocaleString("en-IN")}`} accent="bg-green-500" />
            <StatCard label="Winners" value={data.totalWinners} accent="bg-rose-500" />
            <StatCard label="Customers" value={data.totalCustomers} accent="bg-blue-500" />
          </div>
        </>
      ) : (
        <p className="text-gray-400">Failed to load.</p>
      )}
    </AdminShell>
  );
}
