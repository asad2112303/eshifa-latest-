"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  Inbox,
  Loader2,
  CheckCircle2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNewRequestCount } from "@/components/admin/use-new-request-count";

/**
 * Admin chrome: sidebar navigation, live "new requests" badge and sign-out.
 * Collapses to a drawer below `lg` so the dashboard is usable on a phone.
 */
export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const newCount = useNewRequestCount();

  // Close the drawer whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/requests", label: "Callback Requests", icon: PhoneCall, badge: newCount },
    { href: "/admin/requests?status=new", label: "New Requests", icon: Inbox },
    { href: "/admin/requests?status=in_progress", label: "In Progress", icon: Loader2 },
    { href: "/admin/requests?status=completed", label: "Completed", icon: CheckCircle2 },
  ];

  const isActive = (href: string, exact?: boolean) => {
    const [path, query] = href.split("?");
    if (exact) return pathname === path;
    if (query) return false; // filtered views are highlighted by the page itself
    return pathname.startsWith(path);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#1B004E] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <Image src="/eshifa-logo.png" alt="" width={342} height={428} className="h-9 w-auto brightness-0 invert" />
        <span className="text-lg font-semibold">eShifa Admin</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-[#0289E8] text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-[#ED3237] px-2 py-0.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium">{email}</p>
          <p className="truncate text-xs text-white/60">Administrator</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? "Signing out..." : "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">{sidebar}</aside>
        </>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#E6E9EF] bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="text-[#1B004E]"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
          <span className="font-semibold text-[#1B004E]">eShifa Admin</span>
          {newCount > 0 && (
            <span className="ml-auto rounded-full bg-[#ED3237] px-2 py-0.5 text-xs font-semibold text-white">
              {newCount} new
            </span>
          )}
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
