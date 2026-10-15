"use client";

import React, { useEffect } from "react";
import { Icon, IconName } from "./icons";

/* ───────────── formatters ───────────── */

export const inr = (n: number | string | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

export const fmtDate = (d: string | Date | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

export const fmtDateTime = (d: string | Date | null | undefined) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export function timeAgo(d: string | Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ───────────── tones ───────────── */

export type Tone = "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "slate";

const TONES: Record<Tone, { soft: string; text: string; dot: string; icon: string; bar: string }> = {
  indigo: { soft: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", icon: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { soft: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  rose: { soft: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", icon: "bg-rose-50 text-rose-600", bar: "bg-rose-500" },
  sky: { soft: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", icon: "bg-sky-50 text-sky-600", bar: "bg-sky-500" },
  violet: { soft: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  slate: { soft: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", icon: "bg-slate-100 text-slate-500", bar: "bg-slate-400" },
};

export function Badge({ tone = "slate", children }: { tone?: Tone; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${t.soft} ${t.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {children}
    </span>
  );
}

export function agentStatusBadge(status: string, isActive: boolean) {
  if (status === "pending") return <Badge tone="amber">Pending</Badge>;
  if (status === "rejected") return <Badge tone="rose">Rejected</Badge>;
  if (!isActive) return <Badge tone="slate">Inactive</Badge>;
  return <Badge tone="emerald">Active</Badge>;
}

export function saleStatusBadge(status: string) {
  if (status === "won") return <Badge tone="emerald">Won</Badge>;
  if (status === "lost") return <Badge tone="slate">Lost</Badge>;
  return <Badge tone="amber">Pending</Badge>;
}

/* ───────────── building blocks ───────────── */

export function Panel({
  children,
  className = "",
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-[15px]">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const tones: Tone[] = ["indigo", "emerald", "amber", "rose", "sky", "violet"];
  const idx = (name?.charCodeAt(0) || 0) % tones.length;
  return (
    <div
      className={`rounded-xl flex items-center justify-center font-bold shrink-0 ${TONES[tones[idx]].icon}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name?.charAt(0) || "?").toUpperCase()}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "indigo",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: IconName;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 truncate">{value}</p>
          {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TONES[tone].icon}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Icon name="search" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-sm transition-all placeholder:text-slate-400"
      />
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            value === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-1.5 text-xs ${value === t.key ? "text-indigo-600" : "text-slate-400"}`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "search",
  title,
  hint,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <Icon name={icon} size={26} />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      {hint && <p className="text-sm text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ───────────── data table ───────────── */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
  mobileHidden?: boolean;
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="h-2.5 w-1/4 rounded bg-slate-100" />
          </div>
          <div className="h-3 w-16 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  onRowClick,
  emptyTitle = "Nothing here yet",
  emptyHint,
  emptyIcon = "search",
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyHint?: string;
  emptyIcon?: IconName;
}) {
  if (loading) return <SkeletonRows />;
  if (!rows.length) return <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />;

  const [first, ...rest] = columns;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-indigo-50/40" : ""}`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-5 py-3.5 text-slate-700 ${c.align === "right" ? "text-right" : ""}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.id}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`px-4 py-4 ${onRowClick ? "active:bg-slate-50 cursor-pointer" : ""}`}
          >
            <div className="mb-3">{first.render(row)}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {rest
                .filter((c) => !c.mobileHidden)
                .map((c) => (
                  <div key={c.key} className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {c.header}
                    </p>
                    <div className="text-sm text-slate-700 mt-0.5">{c.render(row)}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────── pagination ───────────── */

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums: number[] = [];
  for (let i = start; i <= Math.min(pages, start + 4); i++) nums.push(i);

  const btn =
    "min-w-9 h-9 px-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-all";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span>
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className={`${btn} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent`}
            aria-label="Previous page"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          {nums.map((n) => (
            <button
              key={n}
              onClick={() => onPage(n)}
              className={`${btn} ${n === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            className={`${btn} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent`}
            aria-label="Next page"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────── side drawer ───────────── */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl animate-drawer-in flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-lg truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60">{footer}</div>}
      </aside>
    </div>
  );
}

export function InfoRow({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
        <Icon name={icon} size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ percent, tone = "indigo" }: { percent: number; tone?: Tone }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full ${TONES[tone].bar}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
