"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Badge,
  Column,
  DataTable,
  Drawer,
  InfoRow,
  Pagination,
  Panel,
  SearchInput,
  Tabs,
  fmtDate,
  inr,
} from "@/components/admin/ui";
import { useAdminList } from "@/hooks/useAdminList";

interface Winning {
  series: string;
  number: number;
  prize_tier: string;
  amount: number;
}
interface Result {
  id: string;
  lotteryName: string;
  drawDate: string;
  matched: boolean;
  createdAt: string;
  winningNumbers: Winning[];
  winnersCount: number;
}

export default function AdminResultsPage() {
  const [status, setStatus] = useState("");
  const list = useAdminList<Result>("/api/admin/results", "results", { status });
  const [selected, setSelected] = useState<Result | null>(null);

  const columns: Column<Result>[] = [
    {
      key: "lottery",
      header: "Lottery",
      render: (r) => <p className="font-semibold text-slate-900">{r.lotteryName}</p>,
    },
    { key: "draw", header: "Draw date", render: (r) => fmtDate(r.drawDate) },
    {
      key: "numbers",
      header: "Winning numbers",
      align: "right",
      render: (r) => (Array.isArray(r.winningNumbers) ? r.winningNumbers.length : 0),
    },
    {
      key: "winners",
      header: "Winning tickets sold",
      align: "right",
      render: (r) => (
        <span className={r.winnersCount > 0 ? "font-bold text-emerald-600" : "text-slate-400"}>
          {r.winnersCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Matching",
      render: (r) =>
        r.matched ? <Badge tone="emerald">Matched</Badge> : <Badge tone="amber">Pending</Badge>,
    },
  ];

  const c = list.counts;

  // Group winning numbers by prize tier for the drawer.
  const grouped = (selected?.winningNumbers ?? []).reduce<Record<string, Winning[]>>((acc, w) => {
    (acc[w.prize_tier] ||= []).push(w);
    return acc;
  }, {});

  return (
    <AdminShell title="Results" subtitle="Draw results and ticket matching">
      <div className="space-y-4">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search lottery name…" />

        <Tabs
          value={status}
          onChange={setStatus}
          tabs={[
            { key: "", label: "All", count: c.all },
            { key: "matched", label: "Matched", count: c.matched ?? 0 },
            { key: "pending", label: "Pending", count: c.pending ?? 0 },
          ]}
        />

        <Panel>
          <DataTable
            columns={columns}
            rows={list.rows}
            loading={list.loading}
            onRowClick={setSelected}
            emptyIcon="results"
            emptyTitle="No results yet"
            emptyHint="Results are fetched automatically after each draw"
          />
          <Pagination {...list.pagination} onPage={list.setPage} />
        </Panel>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.lotteryName ?? ""}
        subtitle="Draw result"
      >
        {selected && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {selected.matched ? <Badge tone="emerald">Matched</Badge> : <Badge tone="amber">Pending</Badge>}
              <span className="text-sm text-slate-500">{selected.winnersCount} winning ticket(s) sold</span>
            </div>
            <InfoRow icon="calendar" label="Draw date">{fmtDate(selected.drawDate)}</InfoRow>
            <InfoRow icon="clock" label="Added">{fmtDate(selected.createdAt)}</InfoRow>

            <div className="mt-5 space-y-5">
              {Object.entries(grouped).map(([tier, nums]) => (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-900">{tier}</p>
                    <p className="text-xs font-semibold text-emerald-600">{inr(nums[0].amount)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nums.map((w, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wide"
                      >
                        {w.series}-{String(w.number).padStart(5, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(grouped).length === 0 && (
                <p className="text-sm text-slate-400">No winning numbers recorded.</p>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
