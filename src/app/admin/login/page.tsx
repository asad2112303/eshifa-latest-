import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: { absolute: "eShifa Admin Portal" },
  robots: { index: false, follow: false },
};

/**
 * LoginForm reads the `next` query param via useSearchParams(), which Next
 * requires to sit inside a Suspense boundary so the rest of the page can still
 * be prerendered.
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FA]" />}>
      <LoginForm />
    </Suspense>
  );
}
