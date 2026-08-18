import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminContext, isAdminConfigured } from "@/lib/admin/auth";
import AdminShell from "@/components/admin/admin-shell";
import NotConfigured from "@/components/admin/not-configured";

export const metadata: Metadata = {
  title: { absolute: "eShifa Admin" },
  robots: { index: false, follow: false },
};

/** Admin pages are per-request: they must never be cached or prerendered. */
export const dynamic = "force-dynamic";

/**
 * Server-side gate for every /admin page.
 *
 * Authorization is decided here, before any patient data is fetched or any
 * markup is sent. Middleware only handles the redirect for unauthenticated
 * navigation; this is the boundary that actually protects the data.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getAdminContext();

  if (!context.ok) {
    if (context.reason === "not_configured") return <NotConfigured />;
    redirect("/admin/login");
  }

  return <AdminShell email={context.email}>{children}</AdminShell>;
}
