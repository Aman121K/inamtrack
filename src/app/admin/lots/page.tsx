"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Badge,
  Column,
  DataTable,
  Pagination,
  Panel,
  ProgressBar,
  SearchInput,
  StatCard,
  Tabs,
  fmtDate,
  inr,
} from "@/components/admin/ui";
import { useAdminList } from "@/hooks/useAdminList";

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
  agent: { id: string; name: string; phone: string; city: string | null };
}

export default function AdminLotsPage() {
  const [status, setStatus] = useState("");
  const list = useAdminList<Lot>("/api/admin/lots", "lots", { status });

  const columns: Column<Lot>[] = [
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
    {
      key: "agent",
      header: "Agent",
      render: (l) => (
        <Link href={`/admin/agents/${l.agent.id}`} className="hover:text-indigo-600">
          <p className="font-medium">{l.agent.name}</p>
          {l.agent.city && <p className="text-xs text-slate-400">{l.agent.city}</p>}
        </Link>
      ),
    },
    { key: "price", header: "Price", align: "right", render: (l) => inr(l.pricePerTicket) },
    {
      key: "sold",
      header: "Sold",
      render: (l) => {
        const pct = l.ticketCount ? Math.round((l.soldCount / l.ticketCount) * 100) : 0;
        return (
          <div className="w-36">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{l.soldCount}/{l.ticketCount}</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <ProgressBar percent={pct} tone={pct >= 80 ? "emerald" : "indigo"} />
          </div>
        );
      },
    },
    { key: "draw", header: "Draw date", render: (l) => fmtDate(l.drawDate) },
    {
      key: "status",
      header: "Status",
      render: (l) => <Badge tone={l.status === "active" ? "emerald" : "slate"}>{l.status}</Badge>,
    },
  ];

  const c = list.counts;
  const tabs = [
    { key: "", label: "All", count: c.all },
    { key: "active", label: "Active", count: c.active ?? 0 },
  ];
  // Surface any other statuses that exist (e.g. completed/closed).
  Object.keys(c)
    .filter((k) => k !== "all" && k !== "active")
    .forEach((k) => tabs.push({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1), count: c[k] }));

  return (
    <AdminShell title="Lots" subtitle="Ticket batches added by all agents">
      <div className="space-y-4">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search lottery or agent…" />

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <StatCard label="Tickets" value={(list.summary.tickets ?? 0).toLocaleString("en-IN")} icon="lots" tone="amber" />
          <StatCard label="Sold" value={(list.summary.sold ?? 0).toLocaleString("en-IN")} icon="sales" tone="emerald" />
        </div>

        <Tabs value={status} onChange={setStatus} tabs={tabs} />

        <Panel>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            emptyIcon="lots"
            emptyTitle="No lots found"
            emptyHint="Lots appear when agents add stock"
          />
          <Pagination {...list.pagination} onPage={list.setPage} />
        </Panel>
      </div>
    </AdminShell>
  );
}
