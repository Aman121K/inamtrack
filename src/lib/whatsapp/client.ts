const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

export async function sendWhatsAppMessage(params: {
  to: string;
  templateName: string;
  templateParams: string[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("[WhatsApp] Not configured — skipping message");
    return { success: false, error: "WhatsApp not configured" };
  }

  const phone = params.to.startsWith("91") ? params.to : `91${params.to}`;
  console.log(`[WhatsApp] Sending ${params.templateName} to ${phone}`);

  try {
    const res = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: params.templateName,
            language: { code: "hi" },
            components: [
              {
                type: "body",
                parameters: params.templateParams.map((text) => ({
                  type: "text",
                  text,
                })),
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();

    if (data.messages?.[0]?.id) {
      console.log(`[WhatsApp] Sent to ${phone}, messageId: ${data.messages[0].id}`);
      return { success: true, messageId: data.messages[0].id };
    }

    console.error(`[WhatsApp] Failed to send to ${phone}: ${JSON.stringify(data.error || data)}`);
    return { success: false, error: JSON.stringify(data.error || data) };
  } catch (e) {
    console.error(`[WhatsApp] Error sending to ${phone}: ${(e as Error).message}`);
    return { success: false, error: (e as Error).message };
  }
}
