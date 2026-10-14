import { NextRequest } from "next/server";
import { success, error } from "@/lib/api/response";
import { scrapePunjabLotteryResults } from "@/lib/scraper/punjab-lottery";
import { matchResults } from "@/lib/matching/engine";
import { processQueuedNotifications } from "@/lib/whatsapp/notify";

export async function POST(req: NextRequest) {
  console.log("[API] POST /api/cron/scrape-results");

  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[API] Unauthorized cron request");
      return error("Unauthorized", 401);
    }

    console.log("[API] Cron authorized — starting scrape...");

    const scrapeResult = await scrapePunjabLotteryResults();
    console.log("[API] Scrape done:", JSON.stringify(scrapeResult));

    console.log("[API] Starting result matching...");
    const matchResult = await matchResults();
    console.log("[API] Match done:", JSON.stringify(matchResult));

    console.log("[API] Flushing WhatsApp notification queue...");
    const notifyResult = await processQueuedNotifications();
    console.log("[API] Notify done:", JSON.stringify(notifyResult));

    return success({
      scrape: scrapeResult,
      match: matchResult,
      notify: notifyResult,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[API] cron scrape error:", e);
    return error("Cron job failed", 500);
  }
}
