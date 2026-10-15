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
  createdAt: string;
}

export default function AdminApprovalsPage() {
  const { adminFetch } = useAdmin();
  const [requests, setRequests] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch("/api/admin/agents?status=pending&limit=50")
      .then((d) => setRequests(d?.agents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      await adminFetch(`/api/admin/agents/${id}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    } finally {
      setActing(null);
    }
  };

  return (
    <AdminShell title="Approvals" subtitle="Agents waiting for access">
      {loading ? (
        <PageLoader />
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-medium">No pending requests</p>
          <p className="text-xs mt-1">All caught up 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <p className="text-gray-500 text-sm mt-0.5">+91 {r.phone}</p>
                  {r.city && <p className="text-gray-400 text-xs mt-0.5">{r.city}</p>}
                </div>
                <span className="text-[11px] text-gray-400 uppercase font-semibold bg-gray-50 px-2 py-1 rounded-lg">
                  {r.preferredLanguage}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => review(r.id, "reject")} disabled={acting === r.id} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-50 text-rose-600 active:bg-rose-100 disabled:opacity-50">Reject</button>
                <button onClick={() => review(r.id, "approve")} disabled={acting === r.id} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white active:bg-emerald-700 disabled:opacity-50">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
