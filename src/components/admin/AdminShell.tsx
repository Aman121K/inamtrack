"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { Icon, IconName } from "./icons";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badgeKey?: "pending";
}

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Dashboard",
    items: [{ href: "/admin", label: "Overview", icon: "overview" }],
  },
  {
    label: "People",
    items: [
      { href: "/admin/agents", label: "Agents", icon: "agents" },
      { href: "/admin/approvals", label: "Approvals", icon: "approvals", badgeKey: "pending" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/lots", label: "Lots", icon: "lots" },
      { href: "/admin/sales", label: "Sales", icon: "sales" },
      { href: "/admin/results", label: "Results", icon: "results" },
    ],
  },
];

function SidebarContent({
  pathname,
  pending,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  pending: number;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 h-16 flex items-center gap-3 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
          <Icon name="results" size={19} />
        </div>
        <div className="leading-tight">
          <p className="text-white font-bold tracking-tight">InamTrack</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.14em]">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {g.label}
            </p>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const badge = item.badgeKey === "pending" ? pending : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-indigo-400" />
                    )}
                    <Icon name={item.icon} size={18} className={active ? "text-indigo-300" : ""} />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-slate-900 text-[11px] font-bold flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
            <Icon name="shield" size={17} />
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-sm font-semibold text-white">Super Admin</p>
            <p className="text-[11px] text-slate-400">Full access</p>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <Icon name="logout" size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
  backHref,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
}) {
  const { adminFetch, logout } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("inamtrack_admin");
    if (!token) router.replace("/admin/login");
    else setReady(true);
  }, [router]);

  // Pending-approvals badge for the sidebar.
  useEffect(() => {
    if (!ready) return;
    adminFetch("/api/admin/agents?limit=1")
      .then((d) => setPending(d?.counts?.pending ?? 0))
      .catch(() => {});
  }, [ready, adminFetch, pathname]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-slate-900 z-30">
        <SidebarContent pathname={pathname} pending={pending} onLogout={logout} />
      </aside>

      {/* Mobile slide-over */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 shadow-2xl">
            <SidebarContent
              pathname={pathname}
              pending={pending}
              onNavigate={() => setMenuOpen(false)}
              onLogout={logout}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200/80">
          <div className="h-16 px-4 sm:px-6 flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center active:bg-slate-50"
            >
              <Icon name="menu" size={19} />
            </button>
            {backHref && (
              <Link
                href={backHref}
                aria-label="Back"
                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all"
              >
                <Icon name="arrowLeft" size={18} />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-slate-900 truncate leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
