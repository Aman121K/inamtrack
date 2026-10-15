"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/ui/Spinner";
import { useAdmin } from "@/hooks/useAdmin";

interface Lot {
  id: string;
  lotteryName: string;
  series: string;
  startNumber: number;
  endNumber: number;
  ticketCount: number;
  soldCount: number;
  pricePerTicket: string;
  drawDate: string;
  status: string;
  createdAt: string;
  agent: { name: string; phone: string; city?: string | null };
}

export default function AdminLotsPage() {
  const { adminFetch } = useAdmin();
  const [lots, setLots] = useState<Lot[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    q.set("limit", "50");
    adminFetch(`/api/admin/lots?${q.toString()}`)
      .then((d) => setLots(d?.lots ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminFetch, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AdminShell title="Lots" subtitle="Ticket batches added by all agents">
      <div className="relative mb-4">
        <input
          placeholder="Search lottery or agent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-white border border-gray-200 outline-none focus:border-indigo-400 text-sm"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {loading ? (
        <PageLoader />
      ) : lots.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No lots found</p>
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => {
            const percent = lot.ticketCount
              ? Math.round((lot.soldCount / lot.ticketCount) * 100)
              : 0;
            return (
              <div key={lot.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{lot.lotteryName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Series {lot.series} · {lot.startNumber}–{lot.endNumber} · ₹{lot.pricePerTicket}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-1">
                      {lot.agent?.name} · +91 {lot.agent?.phone}
                      {lot.agent?.city ? ` · ${lot.agent.city}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      lot.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {lot.status}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{lot.soldCount}/{lot.ticketCount} sold</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <p className="text-[10px] text-gray-300 mt-2">
                  Draw: {new Date(lot.drawDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
