"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";

export default function SettingsPage() {
  const { agent, isLoading, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !agent) router.push("/login");
  }, [agent, isLoading, router]);

  if (isLoading || !agent) return null;

  const languages = [
    { code: "hi" as const, label: "हिन्दी" },
    { code: "pa" as const, label: "ਪੰਜਾਬੀ" },
    { code: "en" as const, label: "English" },
  ];

  return (
    <AppShell>
      <Header title={t("nav.settings")} />
      <div className="px-4 py-4 space-y-4">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-gradient flex items-center justify-center text-white font-bold text-xl shadow-glow shrink-0">
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">{agent.name}</p>
              <p className="text-gray-400 text-sm">{agent.phone}</p>
              {agent.city && (
                <p className="text-gray-300 text-xs mt-0.5">{agent.city}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Language */}
        <Card>
          <p className="font-semibold text-gray-700 mb-3">Language / भाषा</p>
          <div className="flex gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex-1 py-3 rounded-xl text-center font-medium transition-all duration-200 ${
                  lang === l.code
                    ? "bg-primary-gradient text-white shadow-glow"
                    : "bg-gray-50 text-gray-500 active:bg-gray-100"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        {/* App info */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">InamTrack</p>
              <p className="text-xs text-gray-300">Version 1.0.0</p>
            </div>
            <img src="/logo.svg" alt="InamTrack" width={36} height={36} className="rounded-lg" />
          </div>
        </Card>

        {/* Logout */}
        <Button variant="danger" onClick={logout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </Button>
      </div>
    </AppShell>
  );
}
