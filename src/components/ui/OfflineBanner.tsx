"use client";

import { useOnlineStatus } from "@/components/providers/OnlineStatusProvider";
import { useI18n } from "@/components/providers/I18nProvider";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const { t } = useI18n();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-warning-500 text-white text-center py-2 text-sm font-medium z-40">
      {t("common.offline")}
    </div>
  );
}
