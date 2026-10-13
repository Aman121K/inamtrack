export const TEMPLATES = {
  win_congrats: {
    name: "lottery_win_notification",
    buildParams: (data: {
      customerName: string;
      ticketId: string;
      prize: number;
      lotteryName: string;
    }) => [
      data.customerName,
      data.ticketId,
      data.lotteryName,
      `₹${data.prize.toLocaleString("en-IN")}`,
    ],
  },
  loss_summary: {
    name: "lottery_result_summary",
    buildParams: (data: {
      customerName: string;
      lotteryName: string;
      drawDate: string;
    }) => [data.customerName, data.lotteryName, data.drawDate],
  },
  draw_reminder: {
    name: "lottery_draw_reminder",
    buildParams: (data: {
      customerName: string;
      lotteryName: string;
      drawDate: string;
    }) => [data.customerName, data.lotteryName, data.drawDate],
  },
} as const;
