"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PageLoader, Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useApi } from "@/hooks/useApi";

function DetailRow({
  icon,
  label,
  value,
  valueClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`font-semibold text-gray-900 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

interface SaleItem {
  id: string;
  fullTicketId: string;
  ticketNumber: number;
  salePrice: string;
  resultStatus: string;
  prizeAmount: string | null;
  notes: string | null;
  drawDate: string;
  createdAt: string;
  customer: { name: string; phone: string };
  batch: { lotteryName: string; series: string };
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
  const [selectedSale, setSelectedSale] = useState<SaleItem | null>(null);
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
              onClick={() => setSelectedSale(sale)}
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

      <BottomSheet
        open={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={t("sales.detail_title")}
      >
        {selectedSale && (
          <div>
            {/* Header badge */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-gradient flex items-center justify-center text-white shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                  <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2 2" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-extrabold text-gray-900">{selectedSale.fullTicketId}</p>
                {(() => {
                  const s = statusConfig[selectedSale.resultStatus] || statusConfig.pending;
                  return (
                    <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                      {s.icon}
                      {selectedSale.resultStatus}
                    </span>
                  );
                })()}
              </div>
            </div>

            <DetailRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>}
              label={t("sales.lottery")}
              value={`${selectedSale.batch?.lotteryName} · Series ${selectedSale.batch?.series}`}
            />
            <DetailRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              label={t("sales.customer")}
              value={selectedSale.customer?.name}
            />
            <DetailRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
              label={t("sales.phone")}
              value={<a href={`tel:${selectedSale.customer?.phone}`} className="text-indigo-600">{selectedSale.customer?.phone}</a>}
            />
            <DetailRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              label={t("sales.amount")}
              value={`₹${selectedSale.salePrice}`}
              valueClass="text-emerald-600"
            />
            {selectedSale.prizeAmount && (
              <DetailRow
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>}
                label={t("sales.prize")}
                value={`₹${selectedSale.prizeAmount}`}
                valueClass="text-emerald-600"
              />
            )}
            <DetailRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              label={t("sales.draw_date")}
              value={new Date(selectedSale.drawDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            />
            {selectedSale.notes && (
              <DetailRow
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                label={t("sell.notes")}
                value={selectedSale.notes}
                valueClass="font-normal"
              />
            )}
            <DetailRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label={t("sales.sold_on")}
              value={new Date(selectedSale.createdAt).toLocaleString("en-IN")}
              valueClass="font-normal text-sm"
            />
          </div>
        )}
      </BottomSheet>
    </AppShell>
  );
}
