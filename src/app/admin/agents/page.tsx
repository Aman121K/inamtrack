"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdmin } from "@/hooks/useAdmin";

interface AgentRow {
  id: string;
  name: string;
  phone: string;
  city?: string | null;
  preferredLanguage: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  _count: { ticketBatches: number; sales: number; customers: number };
}

const TABS = ["", "pending", "approved", "rejected"] as const;
const TAB_LABELS: Record<string, string> = {
  "": "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function StatusBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (status === "pending")
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Pending</span>;
  if (status === "rejected")
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Rejected</span>;
  if (!isActive)
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>;
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Active</span>;
}

export default function AdminAgentsPage() {
  const { adminFetch } = useAdmin();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (tab) q.set("status", tab);
    if (search) q.set("search", search);
    q.set("limit", "50");
    adminFetch(`/api/admin/agents?${q.toString()}`)
      .then((d) => {
        setAgents(d?.agents ?? []);
        setCounts(d?.counts ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminFetch, tab, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const act = async (id: string, action: string) => {
    setActing(id);
    try {
      await adminFetch(`/api/admin/agents/${id}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      load();
    } catch {
      // ignore
    } finally {
      setActing(null);
    }
  };

  return (
    <AdminShell title="Agents" subtitle="All registered agents">
      <div className="relative mb-4">
        <input
          placeholder="Search name, phone or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-white border border-gray-200 outline-none focus:border-indigo-400 text-sm"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              tab === tb ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {TAB_LABELS[tb]}
            {tb && counts[tb] ? ` (${counts[tb]})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : agents.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No agents found</p>
      ) : (
        <div className="space-y-3">
          {agents.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{a.name}</p>
                    <StatusBadge status={a.status} isActive={a.isActive} />
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">+91 {a.phone}</p>
                  {a.city && <p className="text-gray-400 text-xs">{a.city}</p>}
                </div>
                <div className="flex gap-4 text-center shrink-0">
                  <div>
                    <p className="font-bold text-gray-900">{a._count.ticketBatches}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Lots</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{a._count.sales}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Sales</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{a._count.customers}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Cust.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                {a.status === "pending" ? (
                  <>
                    <button onClick={() => act(a.id, "reject")} disabled={acting === a.id} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-rose-50 text-rose-600 active:bg-rose-100 disabled:opacity-50">Reject</button>
                    <button onClick={() => act(a.id, "approve")} disabled={acting === a.id} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white active:bg-emerald-700 disabled:opacity-50">Approve</button>
                  </>
                ) : a.isActive ? (
                  <button onClick={() => act(a.id, "deactivate")} disabled={acting === a.id} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 active:bg-gray-200 disabled:opacity-50">Deactivate</button>
                ) : (
                  <button onClick={() => act(a.id, "activate")} disabled={acting === a.id} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white active:bg-emerald-700 disabled:opacity-50">Activate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
