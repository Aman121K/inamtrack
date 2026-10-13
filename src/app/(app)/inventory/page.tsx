"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";

interface Batch {
  id: string;
  lotteryName: string;
  series: string;
  startNumber: number;
  endNumber: number;
  ticketCount: number;
  pricePerTicket: string;
  drawDate: string;
  soldCount: number;
  status: string;
}

export default function InventoryPage() {
  const { agent, isLoading } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { apiFetch } = useApi();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    lotteryName: "",
    series: "",
    startNumber: "",
    endNumber: "",
    pricePerTicket: "",
    drawDate: "",
  });

  useEffect(() => {
    if (!isLoading && !agent) router.push("/login");
  }, [agent, isLoading, router]);

  const loadBatches = () => {
    apiFetch("/api/inventory").then(setBatches).catch(() => {});
  };

  useEffect(() => {
    if (agent) loadBatches();
  }, [agent]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/inventory", {
        method: "POST",
        body: JSON.stringify({
          lotteryName: form.lotteryName,
          series: form.series.toUpperCase(),
          startNumber: parseInt(form.startNumber),
          endNumber: parseInt(form.endNumber),
          pricePerTicket: parseFloat(form.pricePerTicket),
          drawDate: form.drawDate,
        }),
      });
      showToast("Lot added!", "success");
      setShowForm(false);
      setForm({
        lotteryName: "",
        series: "",
        startNumber: "",
        endNumber: "",
        pricePerTicket: "",
        drawDate: "",
      });
      loadBatches();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !agent) return null;

  return (
    <AppShell>
      <Header title={t("inventory.title")} />
      <div className="px-4 py-4 space-y-4">
        {showForm ? (
          <Card className="space-y-3">
            <h2 className="font-bold text-lg text-gray-900">
              {t("inventory.add_batch")}
            </h2>
            <Input
              label={t("inventory.lottery_name")}
              placeholder="Diwali Bumper"
              value={form.lotteryName}
              onChange={(e) =>
                setForm({ ...form, lotteryName: e.target.value })
              }
            />
            <Input
              label={t("inventory.series")}
              placeholder="A"
              maxLength={1}
              value={form.series}
              onChange={(e) =>
                setForm({
                  ...form,
                  series: e.target.value.toUpperCase().replace(/[^A-Z]/g, ""),
                })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("inventory.start_number")}
                type="tel"
                inputMode="numeric"
                placeholder="00001"
                value={form.startNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
              <Input
                label={t("inventory.end_number")}
                type="tel"
                inputMode="numeric"
                placeholder="05000"
                value={form.endNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>
            <Input
              label={t("inventory.price")}
              type="tel"
              inputMode="decimal"
              placeholder="200"
              value={form.pricePerTicket}
              onChange={(e) =>
                setForm({
                  ...form,
                  pricePerTicket: e.target.value.replace(/[^\d.]/g, ""),
                })
              }
            />
            <Input
              label={t("inventory.draw_date")}
              type="date"
              value={form.drawDate}
              onChange={(e) => setForm({ ...form, drawDate: e.target.value })}
            />
            <div className="flex gap-3 pt-1">
              <Button
                variant="secondary"
                onClick={() => setShowForm(false)}
                fullWidth
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSubmit} loading={loading} fullWidth>
                {t("common.save")}
              </Button>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setShowForm(true)}>
            + {t("inventory.add_batch")}
          </Button>
        )}

        {/* Batch list */}
        <div className="space-y-3">
          {batches.map((batch) => {
            const percent = Math.round(
              (batch.soldCount / batch.ticketCount) * 100
            );
            const remaining = batch.ticketCount - batch.soldCount;
            return (
              <Card key={batch.id}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {batch.series}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {batch.lotteryName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {batch.startNumber}-{batch.endNumber}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-primary-600">
                    ₹{batch.pricePerTicket}
                  </p>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500">
                    {t("inventory.sold")}: {batch.soldCount} |{" "}
                    {t("inventory.remaining")}: {remaining}
                  </span>
                  <span className="text-gray-300">
                    {new Date(batch.drawDate).toLocaleDateString("hi-IN")}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-gradient h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-right text-[10px] text-gray-300 mt-1">
                  {percent}%
                </p>
              </Card>
            );
          })}
          {batches.length === 0 && !showForm && (
            <div className="text-center py-16 text-gray-400">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <p className="text-sm">{t("common.no_data")}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
