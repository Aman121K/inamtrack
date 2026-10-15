"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Column,
  DataTable,
  Drawer,
  InfoRow,
  Pagination,
  Panel,
  SearchInput,
  StatCard,
  Tabs,
  fmtDate,
  fmtDateTime,
  inr,
  saleStatusBadge,
} from "@/components/admin/ui";
import { useAdminList } from "@/hooks/useAdminList";

interface Sale {
  id: string;
  fullTicketId: string;
  salePrice: string;
  resultStatus: string;
  prizeAmount: string | null;
  notes: string | null;
  drawDate: string;
  createdAt: string;
  agent: { id: string; name: string; phone: string; city: string | null };
  customer: { name: string; phone: string };
  batch: { lotteryName: string; series: string };
}

export default function AdminSalesPage() {
  const [status, setStatus] = useState("");
  const list = useAdminList<Sale>("/api/admin/sales", "sales", { status });
  const [selected, setSelected] = useState<Sale | null>(null);

  const columns: Column<Sale>[] = [
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
    {
      key: "agent",
      header: "Agent",
      render: (s) => (
        <Link
          href={`/admin/agents/${s.agent.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-indigo-600 font-medium"
        >
          {s.agent.name}
        </Link>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (s) => <span className="font-bold text-slate-900">{inr(s.salePrice)}</span>,
    },
    { key: "status", header: "Status", render: (s) => saleStatusBadge(s.resultStatus) },
    { key: "date", header: "Sold on", render: (s) => fmtDateTime(s.createdAt) },
  ];

  const c = list.counts;

  return (
    <AdminShell title="Sales" subtitle="Every ticket sold across all agents">
      <div className="space-y-4">
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search ticket, customer or agent…"
        />

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <StatCard label="Revenue" value={inr(list.summary.revenue)} icon="rupee" tone="emerald" />
          <StatCard label="Prizes won" value={inr(list.summary.prizes)} icon="results" tone="rose" />
        </div>

        <Tabs
          value={status}
          onChange={setStatus}
          tabs={[
            { key: "", label: "All", count: c.all },
            { key: "pending", label: "Pending", count: c.pending ?? 0 },
            { key: "won", label: "Won", count: c.won ?? 0 },
            { key: "lost", label: "Lost", count: c.lost ?? 0 },
          ]}
        />

        <Panel>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            onRowClick={setSelected}
            emptyIcon="sales"
            emptyTitle="No sales found"
            emptyHint="Sales appear as agents sell tickets"
          />
          <Pagination {...list.pagination} onPage={list.setPage} />
        </Panel>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.fullTicketId ?? ""}
        subtitle="Sale details"
      >
        {selected && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-3xl font-extrabold text-slate-900">{inr(selected.salePrice)}</p>
              {saleStatusBadge(selected.resultStatus)}
            </div>
            <InfoRow icon="sales" label="Lottery">
              {selected.batch?.lotteryName} · Series {selected.batch?.series}
            </InfoRow>
            <InfoRow icon="user" label="Customer">
              {selected.customer?.name}
              <a href={`tel:${selected.customer?.phone}`} className="block text-xs font-normal text-indigo-600">
                +91 {selected.customer?.phone}
              </a>
            </InfoRow>
            <InfoRow icon="agents" label="Sold by">
              <Link href={`/admin/agents/${selected.agent.id}`} className="text-indigo-600 hover:underline">
                {selected.agent.name}
              </Link>
              <span className="block text-xs font-normal text-slate-400">
                +91 {selected.agent.phone}
                {selected.agent.city ? ` · ${selected.agent.city}` : ""}
              </span>
            </InfoRow>
            {selected.prizeAmount && (
              <InfoRow icon="results" label="Prize won">
                <span className="text-emerald-600">{inr(selected.prizeAmount)}</span>
              </InfoRow>
            )}
            <InfoRow icon="calendar" label="Draw date">{fmtDate(selected.drawDate)}</InfoRow>
            {selected.notes && <InfoRow icon="note" label="Notes">{selected.notes}</InfoRow>}
            <InfoRow icon="clock" label="Sold on">{fmtDateTime(selected.createdAt)}</InfoRow>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
