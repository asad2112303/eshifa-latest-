"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * eShifa Admin Portal sign-in.
 *
 * Posts to /api/admin/login, which checks the credentials against the
 * configured account and sets an HttpOnly session cookie. The password never
 * reaches this component's state beyond the keystroke, and the cookie it
 * receives is unreadable from JavaScript.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, remember }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        // The server never distinguishes a wrong address from a wrong password.
        setError(result.message ?? "Invalid email or password.");
        return;
      }

      setPassword("");

      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/eshifa-logo.png" alt="eShifa" width={342} height={428} priority className="h-16 w-auto" />
          <h1 className="mt-4 text-2xl font-semibold text-[#1B004E]">eShifa Admin Portal</h1>
          <p className="mt-2 text-sm text-[#777777]">Authorized staff access only.</p>
        </div>

        <div className="rounded-3xl border border-[#EEEEEE] bg-white p-8 shadow-xl">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="admin-email" className="block text-sm font-medium text-[#1B004E]">
                Email Address
              </label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@shifa.com.pk"
                className="bg-[#F5F5F5] border-transparent focus:bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#1B004E]">
                Password
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-[#F5F5F5] border-transparent pr-11 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] transition-colors hover:text-[#1B004E]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#444444]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-[#CCCCCC] accent-[#0289E8]"
              />
              Keep me signed in on this device
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-[#FDF0F0] px-4 py-3 text-sm text-[#C0392B]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[80px] bg-[#0289E8] py-6 font-semibold text-white hover:bg-[#0289E8] disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-[#777777]">
          <ShieldCheck className="h-4 w-4 text-[#0E7A4E]" aria-hidden="true" />
          Patient information is confidential and access is logged.
        </p>
      </div>
    </div>
  );
}
