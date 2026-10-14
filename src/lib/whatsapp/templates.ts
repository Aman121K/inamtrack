// Central WhatsApp message definitions.
//
// WhatsApp Cloud API sends PRE-APPROVED templates: each message = a template
// name registered in Meta Business Manager + an ordered list of body params.
// For every type below:
//   - `name`     = the template name you register in Meta (same string).
//   - `build()`  = turns our data (incl. the mapped agent) into the ordered
//                  params the API needs, plus a `preview` (the beautiful Hindi
//                  text — register this exact wording in Meta, and we also log
//                  it so you can see what the customer would receive).
//
// The agent's details (shop name, city, phone) are injected into EVERY message
// via the `agent` object — that is the per-agent mapping. One central business
// number sends, but each customer sees their own agent's identity.

export type NotificationType = "sale_confirm" | "win_congrats" | "result_out";

export interface AgentInfo {
  name: string;
  phone: string;
  city: string | null;
}

export interface TemplateResult {
  params: string[];
  preview: string;
}

interface TemplateDef {
  name: string;
  build: (data: Record<string, unknown> & { agent: AgentInfo }) => TemplateResult;
}

function agentLine(agent: AgentInfo): string {
  const where = agent.city ? `${agent.name}, ${agent.city}` : agent.name;
  return `— ${where}\n📞 ${agent.phone}`;
}

const templates: Record<NotificationType, TemplateDef> = {
  // Jab agent ticket bechta hai → customer ko confirmation
  sale_confirm: {
    name: "sale_confirm",
    build: ({ agent, customerName, lotteryName, ticketId, price, drawDate }) => {
      const vals = {
        customerName: String(customerName ?? "Grahak"),
        lotteryName: String(lotteryName ?? ""),
        ticketId: String(ticketId ?? ""),
        price: String(price ?? ""),
        drawDate: String(drawDate ?? ""),
      };
      const params = [
        vals.customerName,
        vals.lotteryName,
        vals.ticketId,
        vals.price,
        vals.drawDate,
        agent.name,
        agent.city ?? "",
        agent.phone,
      ];
      const preview =
        `🎟️ Namaste ${vals.customerName} 🙏\n\n` +
        `Aapne *${vals.lotteryName}* ka ticket khareeda hai.\n` +
        `🎫 Ticket: *${vals.ticketId}*\n` +
        `💰 Keemat: ₹${vals.price}\n` +
        `📅 Draw: ${vals.drawDate}\n\n` +
        `Aapko dher saari shubhkamnayein! 🍀\n\n` +
        agentLine(agent);
      return { params, preview };
    },
  },

  // Jab customer ka ticket jeet jaata hai → badhai + inaam kaise len
  win_congrats: {
    name: "win_congrats",
    build: ({ agent, customerName, ticketId, prize, prizeTier, lotteryName }) => {
      const vals = {
        customerName: String(customerName ?? "Grahak"),
        ticketId: String(ticketId ?? ""),
        prize: String(prize ?? ""),
        prizeTier: String(prizeTier ?? ""),
        lotteryName: String(lotteryName ?? ""),
      };
      const params = [
        vals.customerName,
        vals.ticketId,
        vals.prize,
        vals.prizeTier,
        vals.lotteryName,
        agent.name,
        agent.city ?? "",
        agent.phone,
      ];
      const preview =
        `🎉🎊 BADHAI HO ${vals.customerName}! 🎊🎉\n\n` +
        `Aapka ticket *${vals.ticketId}* JEET gaya hai! 🥳\n` +
        `🏆 Inaam: *₹${vals.prize}* (${vals.prizeTier})\n` +
        `🎟️ Lottery: ${vals.lotteryName}\n\n` +
        `Apna inaam lene ke liye sampark karein:\n\n` +
        agentLine(agent);
      return { params, preview };
    },
  },

  // Result aa gaya (jeeta nahi) → agent apne customers ko soochit kar sakta hai
  result_out: {
    name: "result_out",
    build: ({ agent, lotteryName, drawDate }) => {
      const vals = {
        lotteryName: String(lotteryName ?? ""),
        drawDate: String(drawDate ?? ""),
      };
      const params = [vals.lotteryName, vals.drawDate, agent.name, agent.city ?? "", agent.phone];
      const preview =
        `📢 *${vals.lotteryName}* ka result aa gaya hai!\n` +
        `📅 Draw: ${vals.drawDate}\n\n` +
        `Apna ticket check karwane ke liye sampark karein:\n\n` +
        agentLine(agent);
      return { params, preview };
    },
  },
};

export function getTemplate(type: NotificationType): TemplateDef | null {
  return templates[type] ?? null;
}
