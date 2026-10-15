"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Icon } from "@/components/admin/icons";
import { Avatar, EmptyState, Panel, timeAgo } from "@/components/admin/ui";
import { useAdmin } from "@/hooks/useAdmin";

interface Request {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  preferredLanguage: string;
  createdAt: string;
}

export default function AdminApprovalsPage() {
  const { adminFetch } = useAdmin();
  const [requests, setRequests] = useState<Request[]>([]);
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
    <AdminShell
      title="Approvals"
      subtitle={loading ? "Loading…" : `${requests.length} agent${requests.length === 1 ? "" : "s"} waiting for access`}
    >
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Panel>
          <EmptyState icon="approvals" title="No pending requests" hint="New access requests will show up here" />
        </Panel>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map((r) => (
            <Panel key={r.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={r.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400">Requested {timeAgo(r.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Icon name="phone" size={15} className="text-slate-400" /> +91 {r.phone}
                </p>
                {r.city && (
                  <p className="flex items-center gap-2">
                    <Icon name="pin" size={15} className="text-slate-400" /> {r.city}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Icon name="language" size={15} className="text-slate-400" />
                  {r.preferredLanguage.toUpperCase()}
                </p>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => review(r.id, "reject")}
                  disabled={acting === r.id}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={() => review(r.id, "approve")}
                  disabled={acting === r.id}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon name="check" size={16} /> Approve
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
