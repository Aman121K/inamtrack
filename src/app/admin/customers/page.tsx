"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Avatar,
  Column,
  DataTable,
  Drawer,
  InfoRow,
  Pagination,
  Panel,
  SearchInput,
  StatCard,
  fmtDate,
} from "@/components/admin/ui";
import { useAdminList } from "@/hooks/useAdminList";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  totalPurchases: number;
  totalWins: number;
  lastPurchaseAt: string | null;
  createdAt: string;
  agent: { id: string; name: string; phone: string; city: string | null };
}

export default function AdminCustomersPage() {
  const list = useAdminList<CustomerRow>("/api/admin/customers", "customers");
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const columns: Column<CustomerRow>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={c.name} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{c.name}</p>
            <p className="text-xs text-slate-400">+91 {c.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "agent",
      header: "Agent",
      render: (c) => (
        <Link
          href={`/admin/agents/${c.agent.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-indigo-600"
        >
          <p className="font-medium">{c.agent.name}</p>
          {c.agent.city && <p className="text-xs text-slate-400">{c.agent.city}</p>}
        </Link>
      ),
    },
    { key: "purchases", header: "Purchases", align: "right", render: (c) => c.totalPurchases },
    { key: "wins", header: "Wins", align: "right", render: (c) => c.totalWins },
    { key: "last", header: "Last purchase", render: (c) => fmtDate(c.lastPurchaseAt) },
    { key: "added", header: "Added", render: (c) => fmtDate(c.createdAt), mobileHidden: true },
  ];

  return (
    <AdminShell title="Customers" subtitle="Customers across all agents">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search customer name, phone or agent…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <StatCard label="Total customers" value={list.pagination.total} icon="customers" tone="violet" />
          <StatCard label="Total wins" value={list.summary.wins ?? 0} icon="results" tone="rose" />
        </div>

        <Panel>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            onRowClick={setSelected}
            emptyIcon="customers"
            emptyTitle="No customers found"
            emptyHint="Customers appear here when agents make sales"
          />
          <Pagination {...list.pagination} onPage={list.setPage} />
        </Panel>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle="Customer details"
      >
        {selected && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <Avatar name={selected.name} size={56} />
              <div>
                <p className="font-bold text-slate-900 text-lg">{selected.name}</p>
                <a href={`tel:${selected.phone}`} className="text-sm text-indigo-600">
                  +91 {selected.phone}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-2xl font-bold text-indigo-700">{selected.totalPurchases}</p>
                <p className="text-xs text-indigo-600/80">Purchases</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-2xl font-bold text-emerald-700">{selected.totalWins}</p>
                <p className="text-xs text-emerald-600/80">Wins</p>
              </div>
            </div>

            <InfoRow icon="agents" label="Agent">
              <Link href={`/admin/agents/${selected.agent.id}`} className="text-indigo-600 hover:underline">
                {selected.agent.name}
              </Link>
              <span className="block text-xs font-normal text-slate-400">
                +91 {selected.agent.phone}
                {selected.agent.city ? ` · ${selected.agent.city}` : ""}
              </span>
            </InfoRow>
            <InfoRow icon="clock" label="Last purchase">{fmtDate(selected.lastPurchaseAt)}</InfoRow>
            <InfoRow icon="calendar" label="Customer since">{fmtDate(selected.createdAt)}</InfoRow>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
