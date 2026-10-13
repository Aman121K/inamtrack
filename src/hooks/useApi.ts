"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useCallback, useRef } from "react";

export function useApi() {
  const { accessToken, refreshAuth, logout } = useAuth();
  const refreshPromise = useRef<Promise<boolean> | null>(null);

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const url = path.startsWith("/") ? path : `/${path}`;

      const doFetch = (token: string | null) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch(url, { ...options, headers });
      };

      let res = await doFetch(accessToken);

      if (res.status === 401) {
        if (!refreshPromise.current) {
          refreshPromise.current = refreshAuth().finally(() => {
            refreshPromise.current = null;
          });
        }
        const refreshed = await refreshPromise.current;
        if (!refreshed) {
          logout();
          throw new Error("Session expired");
        }
        const freshToken = localStorage.getItem("lottrack_access");
        res = await doFetch(freshToken);
      }

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Request failed");
      return json.data;
    },
    [accessToken, refreshAuth, logout]
  );

  return { apiFetch };
}
