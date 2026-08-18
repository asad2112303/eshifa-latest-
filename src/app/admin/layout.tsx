import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "eShifa Admin" },
  robots: { index: false, follow: false },
};

/**
 * Bare shell for everything under /admin.
 *
 * Deliberately contains NO authorization: it also wraps /admin/login, and
 * gating here would redirect the login page to itself in a loop. The auth gate
 * lives in (protected)/layout.tsx, which covers every admin page except login.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
