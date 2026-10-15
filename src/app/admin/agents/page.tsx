"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Icon } from "@/components/admin/icons";
import {
  Avatar,
  Column,
  DataTable,
  Pagination,
  Panel,
  SearchInput,
  Tabs,
  agentStatusBadge,
  fmtDate,
  inr,
} from "@/components/admin/ui";
import { useAdminList } from "@/hooks/useAdminList";

export interface AgentRow {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  preferredLanguage: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  revenue: number;
  _count: { ticketBatches: number; sales: number; customers: number };
}

export default function AdminAgentsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("recent");
  const list = useAdminList<AgentRow>("/api/admin/agents", "agents", { status, sort });

  const columns: Column<AgentRow>[] = [
    {
      key: "agent",
      header: "Agent",
      render: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={a.name} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{a.name}</p>
            <p className="text-xs text-slate-400">+91 {a.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "city", header: "City", render: (a) => a.city || "—" },
    { key: "status", header: "Status", render: (a) => agentStatusBadge(a.status, a.isActive) },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      render: (a) => <span className="font-bold text-emerald-600">{inr(a.revenue)}</span>,
    },
    { key: "sales", header: "Sales", align: "right", render: (a) => a._count.sales },
    { key: "lots", header: "Lots", align: "right", render: (a) => a._count.ticketBatches },
    { key: "customers", header: "Customers", align: "right", render: (a) => a._count.customers },
    { key: "joined", header: "Joined", render: (a) => fmtDate(a.createdAt), mobileHidden: true },
  ];

  const c = list.counts;

  return (
    <AdminShell title="Agents" subtitle="Every agent, their revenue and activity">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search by name, phone or city…"
          />
          <button
            onClick={() => setSort(sort === "revenue" ? "recent" : "revenue")}
            className={`h-11 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
              sort === "revenue"
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon name="trend" size={16} />
            Top revenue
          </button>
        </div>

        <Tabs
          value={status}
          onChange={setStatus}
          tabs={[
            { key: "", label: "All", count: c.all },
            { key: "approved", label: "Approved", count: c.approved ?? 0 },
            { key: "pending", label: "Pending", count: c.pending ?? 0 },
            { key: "rejected", label: "Rejected", count: c.rejected ?? 0 },
          ]}
        />

        <Panel>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            onRowClick={(a) => router.push(`/admin/agents/${a.id}`)}
            emptyIcon="agents"
            emptyTitle="No agents found"
            emptyHint="Try a different search or filter"
          />
          <Pagination {...list.pagination} onPage={list.setPage} />
        </Panel>
      </div>
    </AdminShell>
  );
}
