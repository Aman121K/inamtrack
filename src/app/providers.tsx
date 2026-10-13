"use client";

import React from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { OnlineStatusProvider } from "@/components/providers/OnlineStatusProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <OnlineStatusProvider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </OnlineStatusProvider>
    </I18nProvider>
  );
}
