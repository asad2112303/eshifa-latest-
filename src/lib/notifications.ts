import { emailLayout, escapeHtml, sendEmail, teamInbox } from "@/lib/email";

/**
 * The messages the site sends when a form is submitted.
 *
 * Every function here is fire-and-forget from the caller's point of view: they
 * return a result rather than throwing, so a mail failure can never turn a
 * saved enquiry into an error for the person who submitted it. The record is
 * already in the database by the time these run.
 */

const UAN = "051-111-111-567";

/** Thank-you to someone who submitted a partnership enquiry. */
export async function sendPartnershipThankYou(input: {
  to: string;
  fullName: string;
  reference: string;
  country: string;
  proposedLocation?: string | null;
}) {
  const name = input.fullName.split(" ")[0] || input.fullName;

  const text = [
    `Dear ${input.fullName},`,
    "",
    "Thank you for your interest in partnering with eShifa.",
    "",
    `We have received your enquiry. Your reference is ${input.reference} — please quote it if you contact us.`,
    "",
    "Our partnership team will review your details and be in touch. If your enquiry is urgent, call us on " + UAN + ".",
    "",
    "eShifa",
    "An outreach partner of Shifa International Hospitals Ltd.",
  ].join("\n");

  const html = emailLayout("Thank you for your enquiry", `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Dear ${escapeHtml(input.fullName)},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Thank you for your interest in partnering with eShifa. We have received your enquiry and our
      partnership team will review it.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#F5F9FF;border-radius:12px;">
      <tr><td style="padding:14px 18px;font-size:14px;color:#1B004E;">
        Your reference: <strong style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(input.reference)}</strong>
        <div style="margin-top:4px;color:#777777;font-size:13px;">Please quote this if you contact us.</div>
      </td></tr>
    </table>
    <p style="margin:0;font-size:15px;line-height:1.6;">
      If your enquiry is urgent, call us on <strong>${UAN}</strong>.
    </p>
  `);

  return sendEmail({
    to: input.to,
    subject: `eShifa partnership enquiry received — ${input.reference}`,
    text,
    html,
  });
}

/**
 * Internal alert so a new enquiry is worked rather than waiting to be noticed.
 *
 * The reply-to is the applicant, so the team can answer from their inbox
 * without copying the address across.
 */
export async function notifyTeamOfPartnershipEnquiry(input: {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  proposedLocation?: string | null;
  message: string;
}) {
  const inbox = teamInbox();
  if (!inbox) return { sent: false, reason: "no_team_inbox" };

  const rows: Array<[string, string]> = [
    ["Reference", input.reference],
    ["Name", input.fullName],
    ["Email", input.email],
    ["Phone", input.phone],
    ["Country", input.country],
    ["Proposed location", input.proposedLocation || "—"],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nMessage:\n${input.message}`;

  const html = emailLayout("New partnership enquiry", `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
      ${rows.map(([k, v]) => `<tr>
        <td style="padding:6px 0;color:#777777;width:150px;">${escapeHtml(k)}</td>
        <td style="padding:6px 0;color:#1B004E;">${escapeHtml(v)}</td>
      </tr>`).join("")}
    </table>
    <p style="margin:18px 0 6px;color:#777777;font-size:13px;">Message</p>
    <p style="margin:0;padding:14px 16px;background:#F5F7FA;border-radius:10px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.message)}</p>
  `);

  return sendEmail({
    to: inbox,
    subject: `Partnership enquiry ${input.reference} — ${input.fullName}`,
    text,
    html,
    replyTo: input.email,
  });
}

/**
 * Internal alert for a new callback request.
 *
 * There is no message to the patient: the callback form collects a phone
 * number and no email address, by design. The ESH- number is the ticket
 * reference, and the admin portal carries the status workflow.
 */
export async function notifyTeamOfCallbackRequest(input: {
  reference: string;
  fullName: string;
  phone: string;
  service: string;
  notes?: string | null;
}) {
  const inbox = teamInbox();
  if (!inbox) return { sent: false, reason: "no_team_inbox" };

  const rows: Array<[string, string]> = [
    ["Ticket", input.reference],
    ["Patient", input.fullName],
    ["Phone", input.phone],
    ["Service", input.service],
  ];

  const text =
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    (input.notes ? `\n\nNotes:\n${input.notes}` : "");

  const html = emailLayout("New callback request", `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
      ${rows.map(([k, v]) => `<tr>
        <td style="padding:6px 0;color:#777777;width:110px;">${escapeHtml(k)}</td>
        <td style="padding:6px 0;color:#1B004E;">${escapeHtml(v)}</td>
      </tr>`).join("")}
    </table>
    ${input.notes ? `<p style="margin:18px 0 6px;color:#777777;font-size:13px;">Notes</p>
    <p style="margin:0;padding:14px 16px;background:#F5F7FA;border-radius:10px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.notes)}</p>` : ""}
    <p style="margin:18px 0 0;font-size:13px;color:#777777;">
      Call the patient on <strong style="color:#1B004E;">${escapeHtml(input.phone)}</strong>, then update the status in the admin portal.
    </p>
  `);

  return sendEmail({
    to: inbox,
    subject: `Callback request ${input.reference} — ${input.service}`,
    text,
    html,
  });
}
