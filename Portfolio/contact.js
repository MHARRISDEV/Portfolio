// Netlify Function: receives the portfolio contact form and forwards it to
// Discord (webhook) and, optionally, to your inbox (Resend).
//
// Environment variables (Netlify > Site configuration > Environment variables):
//   DISCORD_WEBHOOK_URL   required  your Discord channel webhook URL
//   RESEND_API_KEY        optional  enables email delivery through Resend
//   CONTACT_TO_EMAIL      optional  where emails go (default: mharriskhalid@gmail.com)
//   CONTACT_FROM_EMAIL    optional  verified sender, e.g. "Portfolio <contact@yourdomain.com>"
//                                   (default: Resend's onboarding@resend.dev test sender)

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(body)
});

const clip = (value, max) => String(value || "").trim().slice(0, max);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (_) {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  const name = clip(payload.name, 80);
  const email = clip(payload.email, 120);
  const subject = clip(payload.subject, 120);
  const message = clip(payload.message, 3000);

  if (!name || !email || !subject || !message) {
    return json(400, { ok: false, error: "All fields are required" });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: "Invalid email address" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;

  if (!webhookUrl && !resendKey) {
    return json(500, { ok: false, error: "No delivery channel configured" });
  }

  const jobs = [];

  // ---- Discord ----
  if (webhookUrl) {
    jobs.push(
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Portfolio Contact",
          // Stop @everyone / @role pings coming from user text
          allowed_mentions: { parse: [] },
          embeds: [
            {
              title: `New message: ${subject}`.slice(0, 256),
              description: message.slice(0, 4000),
              color: 0xffffff,
              fields: [
                { name: "Name", value: name, inline: true },
                { name: "Email", value: email, inline: true }
              ],
              footer: { text: "portfoliomharrisdev.netlify.app" },
              timestamp: new Date().toISOString()
            }
          ]
        })
      }).then((res) => {
        if (!res.ok) throw new Error(`Discord responded ${res.status}`);
      })
    );
  }

  // ---- Email (Resend) ----
  if (resendKey) {
    const escapeHtml = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    jobs.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
          to: [process.env.CONTACT_TO_EMAIL || "mharriskhalid@gmail.com"],
          reply_to: email,
          subject: `[Portfolio] ${subject}`,
          html:
            `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>` +
            `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` +
            `<hr><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`
        })
      }).then((res) => {
        if (!res.ok) throw new Error(`Resend responded ${res.status}`);
      })
    );
  }

  const results = await Promise.allSettled(jobs);
  const delivered = results.some((r) => r.status === "fulfilled");

  results.forEach((r) => {
    if (r.status === "rejected") console.error("Delivery failed:", r.reason?.message);
  });

  if (!delivered) {
    return json(502, { ok: false, error: "Delivery failed" });
  }
  return json(200, { ok: true });
};
