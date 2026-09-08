/**
 * Outbound email.
 *
 * Deliberately inert until configured. With no RESEND_API_KEY present, send()
 * logs what it would have sent and returns { sent: false } — it never throws.
 * That matters because these calls sit inside form handlers: a missing key, an
 * expired key or a provider outage must never turn a successfully saved
 * enquiry into an error page for the person who submitted it.
 *
 * Resend is used over raw SMTP because it needs one API key rather than host,
 * port and credentials, and it reports bounces. To move to your own mail
 * server instead, replace deliver() below — nothing else calls the provider.
 */

const ENDPOINT = "https://api.resend.com/emails";

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain text alternative. Always send one: some clients show only this. */
  text: string;
  html: string;
  replyTo?: string;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

function apiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

/**
 * The From address. Must be on a domain verified with the provider, or every
 * message is rejected. Falls back to Resend's shared testing sender, which
 * only delivers to the account owner — enough to prove the wiring, not enough
 * to email patients.
 */
function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "eShifa <onboarding@resend.dev>";
}

/** Where internal notifications go. */
export function teamInbox(): string | undefined {
  return process.env.EMAIL_TEAM_INBOX?.trim() || undefined;
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey());
}

async function deliver(message: EmailMessage, key: string): Promise<SendResult> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    // A slow provider must not hold a form submission open indefinitely.
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { sent: false, reason: `provider returned ${response.status} ${detail.slice(0, 200)}` };
  }
  return { sent: true };
}

/**
 * Never throws. Callers can await it without a try/catch and without risking
 * the request they are serving.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const key = apiKey();
  if (!key) {
    // Recipient only — never the body, which carries patient or applicant details.
    console.info(`[email] not configured; would have sent "${message.subject}" to ${message.to}`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    const result = await deliver(message, key);
    if (!result.sent) console.error(`[email] send failed: ${result.reason}`);
    return result;
  } catch (error) {
    console.error("[email] send threw:", error instanceof Error ? error.message : error);
    return { sent: false, reason: "exception" };
  }
}

/** Minimal escaping for values interpolated into the HTML bodies below. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared shell so every message looks like it came from the same place. */
export function emailLayout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#444444;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:#0289E8;padding:20px 28px;">
      <div style="color:#ffffff;font-size:18px;font-weight:600;">eShifa</div>
      <div style="color:rgba(255,255,255,0.85);font-size:13px;">Quality Healthcare at Your Doorstep</div>
    </td></tr>
    <tr><td style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#1B004E;">${escapeHtml(heading)}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#F5F7FA;font-size:12px;color:#777777;">
      eShifa · SIHT (Private) Limited · UAN 051-111-111-567<br>
      This message was sent because an enquiry was submitted at eshifa.org.
    </td></tr>
  </table>
</body></html>`;
}
