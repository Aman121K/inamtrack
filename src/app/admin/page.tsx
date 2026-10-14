"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface AgentRequest {
  id: string;
  name: string;
  phone: string;
  city?: string | null;
  preferredLanguage: string;
  status: string;
  createdAt: string;
}

type Tab = "pending" | "approved" | "rejected";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("pending");
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const router = useRouter();

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("inamtrack_admin") : null;

  const load = useCallback(
    async (status: Tab) => {
      const token = getToken();
      if (!token) {
        router.replace("/admin/login");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/requests?status=${status}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("inamtrack_admin");
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (data.ok) {
          setRequests(data.data.requests);
          setCounts(data.data.counts || {});
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const review = async (id: string, action: "approve" | "reject") => {
    const token = getToken();
    if (!token) return;
    setActing(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setCounts((prev) => ({
          ...prev,
          [tab]: Math.max(0, (prev[tab] || 1) - 1),
          [action === "approve" ? "approved" : "rejected"]:
            (prev[action === "approve" ? "approved" : "rejected"] || 0) + 1,
        }));
      }
    } finally {
      setActing(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("inamtrack_admin");
    router.replace("/admin/login");
  };

  const tabs: Tab[] = ["pending", "approved", "rejected"];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">Super Admin</h1>
          <p className="text-slate-400 text-xs">Agent access requests</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-300 border border-slate-600 rounded-lg px-3 py-1.5 active:bg-slate-700"
        >
          Logout
        </button>
      </header>

      <div className="flex gap-2 px-5 pt-4">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
              tab === tb
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {tb}
            {counts[tb] ? ` (${counts[tb]})` : ""}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin h-7 w-7 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-base font-medium">No {tab} requests</p>
          </div>
        ) : (
          requests.map((r) => (
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

              {tab === "pending" && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="md"
                    variant="danger"
                    onClick={() => review(r.id, "reject")}
                    loading={acting === r.id}
                  >
                    Reject
                  </Button>
                  <Button
                    size="md"
                    onClick={() => review(r.id, "approve")}
                    loading={acting === r.id}
                  >
                    Approve
                  </Button>
                </div>
              )}

              {tab === "rejected" && (
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={() => review(r.id, "approve")} loading={acting === r.id}>
                    Approve now
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
