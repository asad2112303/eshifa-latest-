/** Shared database types. Kept hand-written and small rather than generated. */

export type CallbackStatus = "new" | "contacted" | "in_progress" | "completed" | "cancelled";

export const CALLBACK_STATUSES: CallbackStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "completed",
  "cancelled",
];

export interface CallbackRequest {
  id: string;
  request_no: number;
  full_name: string;
  phone_number: string;
  service: string;
  additional_notes: string | null;
  status: CallbackStatus;
  source: string;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  completed_at: string | null;
}

export interface CallbackActivity {
  id: string;
  callback_request_id: string;
  actor_email: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

/** Human-facing identifier. The uuid remains the internal primary key. */
export const formatRequestNo = (requestNo: number) => `ESH-${requestNo}`;
