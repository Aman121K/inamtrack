"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageLoader, Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useApi } from "@/hooks/useApi";

interface SaleItem {
  id: string;
  fullTicketId: string;
  salePrice: string;
  resultStatus: string;
  prizeAmount: string | null;
  createdAt: string;
  customer: { name: string; phone: string };
  batch: { lotteryName: string };
}

export default function SalesPage() {
  const { agent, isLoading } = useAuth();
  const { t } = useI18n();
  const { apiFetch } = useApi();
  const router = useRouter();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading && !agent) router.push("/login");
  }, [agent, isLoading, router]);

  // Load one page; `replace` resets the list (initial load / new search).
  const load = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!agent) return;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const q = new URLSearchParams();
        if (search) q.set("search", search);
        q.set("page", String(pageNum));
        const d = await apiFetch(`/api/sales?${q.toString()}`);
        const items: SaleItem[] = d?.sales ?? [];
        setSales((prev) => (replace ? items : [...prev, ...items]));
        setHasMore(pageNum < (d?.pagination?.pages ?? 1));
        setPage(pageNum);
      } catch {
        // ignore
      } finally {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [agent, apiFetch, search]
  );

  // Debounced search (lazy search as you type) + initial load.
  useEffect(() => {
    if (!agent) return;
    const t = setTimeout(() => load(1, true), 300);
    return () => clearTimeout(t);
  }, [agent, search, load]);

  // Infinite scroll: load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          load(page + 1, false);
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, page, load]);

  if (isLoading || !agent) return null;

  const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    won: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      ),
    },
    lost: {
      bg: "bg-gray-50",
      text: "text-gray-400",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
    },
  };

  return (
    <AppShell>
      <Header title={t("nav.sales")} />
      <div className="px-4 py-4 space-y-3">
        <div className="relative">
          <Input
            placeholder={`${t("sales.search_placeholder")}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
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

        {loading && <PageLoader />}

        {!loading && sales.map((sale) => {
          const status = statusConfig[sale.resultStatus] || statusConfig.pending;
          return (
            <Card
              key={sale.id}
              className="animate-fade-up"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0 mt-0.5">
                    {sale.fullTicketId?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{sale.fullTicketId}</p>
                    <p className="text-xs text-gray-400">{sale.batch?.lotteryName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sale.customer?.name} · {sale.customer?.phone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{sale.salePrice}</p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.icon}
                    {sale.resultStatus}
                  </span>
                  {sale.prizeAmount && (
                    <p className="text-emerald-600 font-bold text-sm mt-1">
                      Won ₹{sale.prizeAmount}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-300 mt-2">
                {new Date(sale.createdAt).toLocaleString("hi-IN")}
              </p>
            </Card>
          );
        })}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {loadingMore && <Spinner />}
          </div>
        )}

        {!loading && sales.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="8" y1="16" x2="8" y2="10" /><line x1="12" y1="16" x2="12" y2="7" /><line x1="16" y1="16" x2="16" y2="13" />
              </svg>
            </div>
            <p className="text-sm">{t("common.no_data")}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
