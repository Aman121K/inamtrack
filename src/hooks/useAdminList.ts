"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "./useAdmin";

interface Pagination {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

// Shared list behaviour for admin pages: debounced search, filters,
// server pagination, and protection against out-of-order responses.
export function useAdminList<T>(
  path: string,
  listKey: string,
  filters: Record<string, string> = {},
  limit = 15
) {
  const { adminFetch } = useAdmin();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0, limit });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Changing search/filters resets to page 1 without an extra fetch.
  const filterKey = JSON.stringify(filters);
  const queryKey = `${debounced}|${filterKey}`;
  const [pageState, setPageState] = useState({ key: queryKey, page: 1 });
  const page = pageState.key === queryKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: queryKey, page: p });

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      Object.entries(JSON.parse(filterKey) as Record<string, string>).forEach(([k, v]) => {
        if (v) q.set(k, v);
      });
      if (debounced) q.set("search", debounced);
      q.set("page", String(page));
      q.set("limit", String(limit));
      const d = await adminFetch(`${path}?${q.toString()}`);
      if (id !== reqId.current) return; // a newer request superseded this one
      setRows(d?.[listKey] ?? []);
      if (d?.pagination) setPagination(d.pagination);
      setCounts(d?.counts ?? {});
      setSummary(d?.summary ?? {});
    } catch {
      // handled by adminFetch (401 redirect); keep previous rows
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [adminFetch, path, listKey, filterKey, debounced, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, pagination, counts, summary, loading, search, setSearch, page, setPage, reload: load };
}
