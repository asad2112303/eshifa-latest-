import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * Dead-end screen for the two states where the dashboard must not render:
 * Supabase is not configured, or the account is not authorized.
 * Neither variant reveals anything about the data or the environment.
 */
export default function NotConfigured({ variant = "setup" }: { variant?: "setup" | "denied" }) {
  const denied = variant === "denied";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#EEEEEE] bg-white p-8 text-center shadow-xl">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ED3237]/10 text-[#ED3237]">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mb-3 text-2xl font-semibold text-[#1B004E]">
          {denied ? "Access Denied" : "Admin portal not configured"}
        </h1>

        <p className="mb-6 text-base leading-relaxed text-[#444444]">
          {denied
            ? "Your account is not authorized to use the eShifa admin portal. Contact your administrator if you believe this is a mistake."
            : "Supabase credentials are missing. Add them to the environment and restart the server. See README-ADMIN.md."}
        </p>

        <Link
          href={denied ? "/admin/login" : "/"}
          className="inline-flex rounded-[80px] bg-[#0289E8] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0270C4]"
        >
          {denied ? "Back to sign in" : "Back to website"}
        </Link>
      </div>
    </div>
  );
}
