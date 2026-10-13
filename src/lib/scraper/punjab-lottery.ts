import * as cheerio from "cheerio";
import { prisma } from "../db";

const PUNJAB_LOTTERY_URL = "https://punjabstatelotteries.gov.in/resultnew.aspx";

interface WinningNumber {
  series: string;
  number: number;
  prize_tier: string;
  amount: number;
}

export async function scrapePunjabLotteryResults(): Promise<{
  scraped: number;
  errors: string[];
}> {
  console.log("[Scraper] Starting Punjab lottery scrape...");
  const errors: string[] = [];
  let scraped = 0;

  try {
    const res = await fetch(PUNJAB_LOTTERY_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      console.error(`[Scraper] HTTP error: ${res.status}`);
      return { scraped: 0, errors: [`HTTP ${res.status}`] };
    }

    console.log("[Scraper] Page fetched, parsing HTML...");
    const html = await res.text();
    const $ = cheerio.load(html);

    const tables = $("table.table");
    console.log(`[Scraper] Found ${tables.length} result tables`);

    tables.each((_, table) => {
      try {
        const headerRow = $(table).find("tr").first();
        const lotteryName = headerRow.text().trim();
        const drawDateText = $(table).find("tr").eq(1).text().trim();

        const dateMatch = drawDateText.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
        if (!dateMatch) {
          console.warn(`[Scraper] Could not parse date from: ${drawDateText.slice(0, 50)}`);
          return;
        }

        const drawDate = new Date(
          `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
        );

        const winningNumbers: WinningNumber[] = [];

        $(table)
          .find("tr")
          .slice(2)
          .each((_, row) => {
            const cells = $(row).find("td");
            if (cells.length >= 3) {
              const prizeTier = $(cells[0]).text().trim();
              const ticketId = $(cells[1]).text().trim();
              const amount = parseFloat(
                $(cells[2]).text().replace(/[^\d.]/g, "")
              );

              const ticketMatch = ticketId.match(/([A-Z])\s*-?\s*(\d+)/);
              if (ticketMatch) {
                winningNumbers.push({
                  series: ticketMatch[1],
                  number: parseInt(ticketMatch[2]),
                  prize_tier: prizeTier,
                  amount: amount || 0,
                });
              }
            }
          });

        if (lotteryName && winningNumbers.length > 0) {
          console.log(`[Scraper] ${lotteryName} (${drawDate.toISOString().split("T")[0]}) — ${winningNumbers.length} prizes`);
          prisma.drawResult
            .upsert({
              where: {
                lotteryName_drawDate: {
                  lotteryName,
                  drawDate,
                },
              },
              update: { winningNumbers: winningNumbers as object[] },
              create: {
                lotteryName,
                drawDate,
                winningNumbers: winningNumbers as object[],
              },
            })
            .then(() => scraped++)
            .catch((e) => {
              console.error(`[Scraper] DB error for ${lotteryName}: ${e.message}`);
              errors.push(e.message);
            });
        }
      } catch (e) {
        console.error(`[Scraper] Parse error: ${(e as Error).message}`);
        errors.push((e as Error).message);
      }
    });
  } catch (e) {
    console.error(`[Scraper] Fetch error: ${(e as Error).message}`);
    errors.push((e as Error).message);
  }

  console.log(`[Scraper] Done — ${scraped} results scraped, ${errors.length} errors`);
  return { scraped, errors };
}
