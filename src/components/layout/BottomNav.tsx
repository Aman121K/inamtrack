"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#6366f1" : "none"} stroke={active ? "#6366f1" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BoxIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#6366f1" : "none"} stroke={active ? "#6366f1" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#6366f1" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#6366f1" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const sideItems = [
  { href: "/dashboard", Icon: HomeIcon, labelKey: "nav.home" },
  { href: "/inventory", Icon: BoxIcon, labelKey: "nav.inventory" },
  { href: "/sales", Icon: ChartIcon, labelKey: "nav.sales" },
  { href: "/settings", Icon: SettingsIcon, labelKey: "nav.settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isSellActive = pathname.startsWith("/sell");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe-bottom">
      <div className="max-w-lg mx-auto relative">
        {/* Floating center sell button */}
        <Link
          href="/sell"
          className={`absolute left-1/2 -translate-x-1/2 -top-6 w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
            isSellActive
              ? "bg-primary-gradient shadow-glow scale-105"
              : "bg-primary-gradient shadow-elevated hover:shadow-glow"
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 10h20" />
            <path d="M12 14v4" />
            <path d="M10 16h4" />
          </svg>
        </Link>

        {/* Nav bar */}
        <div className="bg-white rounded-t-3xl shadow-nav border-t border-gray-50">
          <div className="flex items-center justify-around h-[68px] px-2">
            {sideItems.map((item, i) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 ${
                    isActive ? "text-primary-600" : "text-gray-400"
                  } ${i >= 2 ? "order-last" : ""}`}
                >
                  <item.Icon active={isActive} />
                  <span className={`text-[10px] leading-none ${isActive ? "font-bold" : "font-medium"}`}>
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
            {/* Spacer for center button */}
            <div className="w-[60px] order-2" />
          </div>
        </div>
      </div>
    </nav>
  );
}
