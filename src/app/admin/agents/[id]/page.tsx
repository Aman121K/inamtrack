"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Icon } from "@/components/admin/icons";
import {
  Avatar,
  Column,
  DataTable,
  Pagination,
  Panel,
  ProgressBar,
  StatCard,
  Tabs,
  agentStatusBadge,
  fmtDate,
  fmtDateTime,
  inr,
  saleStatusBadge,
  timeAgo,
} from "@/components/admin/ui";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminList } from "@/hooks/useAdminList";

interface AgentDetail {
  agent: {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    preferredLanguage: string;
    status: string;
    isActive: boolean;
    createdAt: string;
    _count: { ticketBatches: number; sales: number; customers: number };
  };
  stats: {
    totalSales: number;
    totalRevenue: number;
    winners: number;
    prizeTotal: number;
    ticketsTotal: number;
    ticketsSold: number;
    lastSaleAt: string | null;
  };
  trend: { date: string; sales: number; revenue: number }[];
  byLottery: { lottery: string; sales: number; revenue: number }[];
}

interface LotRow {
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
}
interface SaleRow {
  id: string;
  fullTicketId: string;
  salePrice: string;
  resultStatus: string;
  prizeAmount: string | null;
  createdAt: string;
  customer: { name: string; phone: string };
  batch: { lotteryName: string };
}
interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  totalPurchases: number;
  totalWins: number;
  lastPurchaseAt: string | null;
}

function TrendChart({ trend }: { trend: AgentDetail["trend"] }) {
  const max = Math.max(...trend.map((t) => t.revenue), 1);
  const total = trend.reduce((a, t) => a + t.revenue, 0);
  return (
    <div className="p-5">
      <p className="text-xs text-slate-500">Last 30 days</p>
      <p className="text-2xl font-bold text-slate-900 mb-4">{inr(total)}</p>
      <div className="flex items-end gap-[3px] h-32">
        {trend.map((t) => (
          <div
            key={t.date}
            title={`${t.date}: ${t.sales} sales · ${inr(t.revenue)}`}
            className={`flex-1 rounded-t ${
              t.revenue > 0 ? "bg-gradient-to-t from-indigo-600 to-indigo-400" : "bg-slate-100"
            }`}
            style={{ height: `${Math.max(4, (t.revenue / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-2">
        <span>{fmtDate(trend[0]?.date)}</span>
        <span>{fmtDate(trend[trend.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

function LotsTab({ agentId }: { agentId: string }) {
  const list = useAdminList<LotRow>("/api/admin/lots", "lots", { agentId }, 10);
  const columns: Column<LotRow>[] = [
    {
      key: "lot",
      header: "Lottery",
      render: (l) => (
        <div>
          <p className="font-semibold text-slate-900">{l.lotteryName}</p>
          <p className="text-xs text-slate-400">
            Series {l.series} · {l.startNumber}–{l.endNumber}
          </p>
        </div>
      ),
    },
    { key: "price", header: "Price", render: (l) => inr(l.pricePerTicket) },
    {
      key: "sold",
      header: "Sold",
      render: (l) => (
        <div className="w-32">
          <p className="text-xs text-slate-500 mb-1">
            {l.soldCount}/{l.ticketCount}
          </p>
          <ProgressBar percent={l.ticketCount ? (l.soldCount / l.ticketCount) * 100 : 0} />
        </div>
      ),
    },
    { key: "draw", header: "Draw", render: (l) => fmtDate(l.drawDate) },
  ];
  return (
    <>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} emptyIcon="lots" emptyTitle="No lots added" />
      <Pagination {...list.pagination} onPage={list.setPage} />
    </>
  );
}

function SalesTab({ agentId }: { agentId: string }) {
  const list = useAdminList<SaleRow>("/api/admin/sales", "sales", { agentId }, 10);
  const columns: Column<SaleRow>[] = [
    {
      key: "ticket",
      header: "Ticket",
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.fullTicketId}</p>
          <p className="text-xs text-slate-400">{s.batch?.lotteryName}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (s) => (
        <div>
          <p className="font-medium">{s.customer?.name}</p>
          <p className="text-xs text-slate-400">{s.customer?.phone}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", align: "right", render: (s) => <span className="font-bold">{inr(s.salePrice)}</span> },
    { key: "status", header: "Status", render: (s) => saleStatusBadge(s.resultStatus) },
    { key: "date", header: "Date", render: (s) => fmtDateTime(s.createdAt) },
  ];
  return (
    <>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} emptyIcon="sales" emptyTitle="No sales yet" />
      <Pagination {...list.pagination} onPage={list.setPage} />
    </>
  );
}

function CustomersTab({ agentId }: { agentId: string }) {
  const list = useAdminList<CustomerRow>("/api/admin/customers", "customers", { agentId }, 10);
  const columns: Column<CustomerRow>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size={32} />
          <div>
            <p className="font-semibold text-slate-900">{c.name}</p>
            <p className="text-xs text-slate-400">{c.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "purchases", header: "Purchases", align: "right", render: (c) => c.totalPurchases },
    { key: "wins", header: "Wins", align: "right", render: (c) => c.totalWins },
    { key: "last", header: "Last purchase", render: (c) => fmtDate(c.lastPurchaseAt) },
  ];
  return (
    <>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} emptyIcon="customers" emptyTitle="No customers yet" />
      <Pagination {...list.pagination} onPage={list.setPage} />
    </>
  );
}

export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { adminFetch } = useAdmin();
  const [data, setData] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("sales");
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    adminFetch(`/api/admin/agents/${id}`)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [adminFetch, id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string) => {
    setActing(true);
    try {
      await adminFetch(`/api/admin/agents/${id}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      load();
    } catch {
      // ignore
    } finally {
      setActing(false);
    }
  };

  const a = data?.agent;
  const s = data?.stats;

  const actionButtons = a && (
    <>
      {a.status === "pending" ? (
        <>
          <button onClick={() => act("reject")} disabled={acting} className="h-10 px-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-all">
            Reject
          </button>
          <button onClick={() => act("approve")} disabled={acting} className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
            Approve
          </button>
        </>
      ) : a.status === "rejected" ? (
        <button onClick={() => act("approve")} disabled={acting} className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
          Approve
        </button>
      ) : a.isActive ? (
        <button onClick={() => act("deactivate")} disabled={acting} className="h-10 px-4 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-all">
          Deactivate
        </button>
      ) : (
        <button onClick={() => act("activate")} disabled={acting} className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
          Activate
        </button>
      )}
    </>
  );

  return (
    <AdminShell
      title={a?.name ?? "Agent"}
      subtitle="Agent profile"
      backHref="/admin/agents"
      actions={actionButtons}
    >
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-200/60" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        </div>
      ) : notFound || !a || !s ? (
        <Panel>
          <div className="py-16 text-center text-slate-400">Agent not found</div>
        </Panel>
      ) : (
        <div className="space-y-6">
          {/* Identity */}
          <Panel className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar name={a.name} size={64} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900">{a.name}</h2>
                  {agentStatusBadge(a.status, a.isActive)}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Icon name="phone" size={14} />
                    <a href={`tel:${a.phone}`} className="hover:text-indigo-600">+91 {a.phone}</a>
                  </span>
                  {a.city && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="pin" size={14} /> {a.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Icon name="language" size={14} /> {a.preferredLanguage.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="calendar" size={14} /> Joined {fmtDate(a.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" size={14} />
                    {s.lastSaleAt ? `Last sale ${timeAgo(s.lastSaleAt)}` : "No sales yet"}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={inr(s.totalRevenue)} icon="rupee" tone="emerald" />
            <StatCard label="Total Sales" value={s.totalSales} icon="sales" tone="indigo" hint={`${s.ticketsSold}/${s.ticketsTotal} tickets sold`} />
            <StatCard label="Customers" value={a._count.customers} icon="customers" tone="violet" />
            <StatCard label="Lots" value={a._count.ticketBatches} icon="lots" tone="amber" />
            <StatCard label="Winners" value={s.winners} icon="results" tone="rose" />
            <StatCard label="Prize Won" value={inr(s.prizeTotal)} icon="trend" tone="sky" hint="Across all customers" />
            <StatCard
              label="Avg. ticket value"
              value={inr(s.totalSales ? Math.round(s.totalRevenue / s.totalSales) : 0)}
              icon="rupee"
              tone="slate"
            />
            <StatCard
              label="Sell-through"
              value={`${s.ticketsTotal ? Math.round((s.ticketsSold / s.ticketsTotal) * 100) : 0}%`}
              icon="trend"
              tone="emerald"
            />
          </div>

          {/* Trend + lottery breakdown */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Panel title="Revenue trend" className="lg:col-span-2">
              <TrendChart trend={data.trend} />
            </Panel>
            <Panel title="Revenue by lottery">
              {data.byLottery.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">No sales yet</p>
              ) : (
                <ul className="px-5 py-4 space-y-4">
                  {data.byLottery.map((l) => (
                    <li key={l.lottery}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700 truncate pr-2">{l.lottery}</span>
                        <span className="font-bold text-slate-900">{inr(l.revenue)}</span>
                      </div>
                      <ProgressBar percent={s.totalRevenue ? (l.revenue / s.totalRevenue) * 100 : 0} />
                      <p className="text-[11px] text-slate-400 mt-1">{l.sales} sales</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Detail tabs */}
          <div className="space-y-4">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { key: "sales", label: "Sales", count: s.totalSales },
                { key: "lots", label: "Lots", count: a._count.ticketBatches },
                { key: "customers", label: "Customers", count: a._count.customers },
              ]}
            />
            <Panel>
              {tab === "sales" && <SalesTab agentId={a.id} />}
              {tab === "lots" && <LotsTab agentId={a.id} />}
              {tab === "customers" && <CustomersTab agentId={a.id} />}
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
