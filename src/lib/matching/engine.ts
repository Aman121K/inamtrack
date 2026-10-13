import { prisma } from "../db";

interface WinningNumber {
  series: string;
  number: number;
  prize_tier: string;
  amount: number;
}

export async function matchResults(): Promise<{
  matched: number;
  winners: number;
}> {
  console.log("[Match] Starting result matching...");

  const unmatchedResults = await prisma.drawResult.findMany({
    where: { matched: false },
  });

  console.log(`[Match] Found ${unmatchedResults.length} unmatched draw results`);

  let totalMatched = 0;
  let totalWinners = 0;

  for (const result of unmatchedResults) {
    const winningNumbers = result.winningNumbers as unknown as WinningNumber[];
    console.log(`[Match] Processing ${result.lotteryName} (${result.drawDate.toISOString().split("T")[0]}) — ${winningNumbers.length} winning numbers`);

    for (const winner of winningNumbers) {
      const fullTicketId = `${winner.series}-${String(winner.number).padStart(5, "0")}`;

      const winningSales = await prisma.sale.findMany({
        where: {
          fullTicketId,
          drawDate: result.drawDate,
          resultStatus: "pending",
        },
      });

      for (const sale of winningSales) {
        console.log(`[Match] WINNER! Ticket ${fullTicketId} — Prize: ₹${winner.amount} (${winner.prize_tier}) — Agent: ${sale.agentId}`);

        await prisma.sale.update({
          where: { id: sale.id },
          data: {
            resultStatus: "won",
            prizeAmount: winner.amount,
          },
        });

        await prisma.customer.update({
          where: { id: sale.customerId },
          data: { totalWins: { increment: 1 } },
        });

        await prisma.notification.create({
          data: {
            agentId: sale.agentId,
            type: "win_congrats",
            recipientPhone: (
              await prisma.customer.findUnique({
                where: { id: sale.customerId },
              })
            )!.phone,
            templateParams: {
              ticketId: fullTicketId,
              prize: winner.amount,
              prizeTier: winner.prize_tier,
              lotteryName: result.lotteryName,
            },
          },
        });

        totalWinners++;
      }
    }

    await prisma.sale.updateMany({
      where: {
        drawDate: result.drawDate,
        resultStatus: "pending",
      },
      data: { resultStatus: "lost" },
    });

    await prisma.drawResult.update({
      where: { id: result.id },
      data: { matched: true },
    });

    totalMatched++;
  }

  console.log(`[Match] Done — ${totalMatched} draws matched, ${totalWinners} winners found`);
  return { matched: totalMatched, winners: totalWinners };
}
