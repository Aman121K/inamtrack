"use client";

import { useAuth } from "@/components/providers/AuthProvider";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack, onBack }: HeaderProps) {
  const { agent } = useAuth();

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-lg z-20 border-b border-gray-100/50">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={onBack || (() => window.history.back())}
            className="mr-3 w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 active:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1">
          {title}
        </h1>
        {agent && (
          <div className="w-9 h-9 rounded-xl bg-primary-gradient text-white flex items-center justify-center font-bold text-sm shadow-glow">
            {agent.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
