"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAdmin() {
  const router = useRouter();

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("inamtrack_admin") : null;

  const adminFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = getToken();
      if (!token) {
        router.replace("/admin/login");
        throw new Error("No admin token");
      }
      const res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        localStorage.removeItem("inamtrack_admin");
        router.replace("/admin/login");
        throw new Error("Unauthorized");
      }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Request failed");
      return json.data;
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("inamtrack_admin");
    router.replace("/admin/login");
  }, [router]);

  return { adminFetch, logout, getToken };
}
