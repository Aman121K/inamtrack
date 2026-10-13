"use client";

import React from "react";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f2f8]">
      <OfflineBanner />
      <main className="pb-nav-h max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
