import "server-only";

import { google } from "googleapis";

/**
 * Appends callback requests to a Google Sheet.
 *
 * Google Sheets rather than a server-side .xlsx because this app deploys to
 * serverless (Vercel), where the filesystem is read-only apart from an
 * ephemeral /tmp — a workbook written on disk would be discarded between
 * invocations and submissions would be silently lost. Sheets also gives the
 * care team a live view and native Excel export.
 *
 * Auth uses a Google service account. Credentials come from environment
 * variables and are read only on the server; nothing reaches the browser.
 */

export interface CallbackRecord {
  fullName: string;
  phone: string;
  service: string;
  additionalNotes: string;
  source: string;
  createdAt: Date;
}

const SHEET_TAB = process.env.GOOGLE_SHEETS_TAB?.trim() || "Sheet1";

const HEADER_ROW = [
  "Created At",
  "Full Name",
  "Phone",
  "Service",
  "Additional Notes",
  "Source",
];

/** Thrown when the integration is not configured, so callers can respond clearly. */
export class CallbackStoreNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Google Sheets is not configured. Missing: ${missing.join(", ")}`);
    this.name = "CallbackStoreNotConfiguredError";
  }
}

function readConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  // Private keys are stored with literal \n escapes in most hosting UIs.
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  const missing: string[] = [];
  if (!spreadsheetId) missing.push("GOOGLE_SHEETS_ID");
  if (!clientEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!privateKey) missing.push("GOOGLE_PRIVATE_KEY");
  if (missing.length) throw new CallbackStoreNotConfiguredError(missing);

  return { spreadsheetId: spreadsheetId!, clientEmail: clientEmail!, privateKey: privateKey! };
}

function getSheetsClient(clientEmail: string, privateKey: string) {
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * Google Sheets interprets a leading =, +, - or @ as a formula. Prefixing with
 * an apostrophe forces the value to be stored as literal text, so a crafted
 * field cannot execute when the sheet is opened. Excel applies the same rule on
 * export, and the apostrophe is not shown in the cell.
 */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Writes the header row once, if the sheet is empty. */
async function ensureHeaderRow(
  sheets: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string,
): Promise<void> {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A1:F1`,
  });

  if (existing.data.values?.[0]?.length) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADER_ROW] },
  });
}

/**
 * Appends one request as a new row.
 *
 * Uses the Sheets append API, which allocates the next empty row server-side —
 * so concurrent submissions cannot overwrite each other the way a
 * read-modify-write against a single file can.
 */
export async function appendCallbackRecord(record: CallbackRecord): Promise<void> {
  const { spreadsheetId, clientEmail, privateKey } = readConfig();
  const sheets = getSheetsClient(clientEmail, privateKey);

  await ensureHeaderRow(sheets, spreadsheetId);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_TAB}!A:F`,
    valueInputOption: "RAW", // never USER_ENTERED — that would evaluate formulas
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          record.createdAt.toISOString(),
          neutralizeFormula(record.fullName),
          neutralizeFormula(record.phone),
          neutralizeFormula(record.service),
          neutralizeFormula(record.additionalNotes),
          record.source,
        ],
      ],
    },
  });
}

/** True when all required credentials are present. Used by the health check. */
export function isCallbackStoreConfigured(): boolean {
  try {
    readConfig();
    return true;
  } catch {
    return false;
  }
}
