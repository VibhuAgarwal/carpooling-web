"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const phrases = useMemo(
    () => ["Share rides", "Split costs", "Meet verified commuters", "Arrive greener"],
    []
  );
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Simple interactive “glow” on desktop hero
  const [pointer, setPointer] = useState({ x: 0.35, y: 0.35 });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    // Respect reduced motion
    const media =
      typeof window !== "undefined"
        ? window.matchMedia?.("(prefers-reduced-motion: reduce)")
        : null;

    if (media?.matches) return;

    const id = window.setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }, 2500);

    return () => window.clearInterval(id);
  }, [phrases.length]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormError(null);

    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : "/dashboard";

    await signIn("google", { callbackUrl });
  };

  const handleJwtLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setFormError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return setFormError("Email is required.");
    if (!password) return setFormError("Password is required.");
    if (mode === "signup" && password !== confirmPassword) {
      return setFormError("Passwords do not match.");
    }

    setLoading(true);
    try {
      // Optional: create account first (requires you to implement /api/auth/register)
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "Sign up failed.");
        }
      }

      // Credentials sign-in (JWT-based if NextAuth is configured with JWT strategy)
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!result || result.error) {
        throw new Error(result?.error || "Invalid email or password.");
      }

      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Authentication failed.");
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Left section */}
      <div
        className="relative hidden md:flex flex-col justify-center px-12 overflow-hidden bg-[#070707] text-white"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          setPointer({ x, y });
        }}
      >
        {/* Interactive glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl transition-transform duration-150"
          style={{
        transform: `translate(${(pointer.x - 0.5) * 40}px, ${(pointer.y - 0.5) * 40}px)`,
          }}
        >
          <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-500/35 to-cyan-400/10" />
          <div className="absolute right-16 bottom-12 h-80 w-80 rounded-full bg-gradient-to-tr from-fuchsia-500/25 to-amber-400/10" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Live carpool matching
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
        CarPool
        <span className="block mt-1 text-base font-medium text-white/85">
          <span className="text-white">{phrases[phraseIndex]}</span>
          <span className="text-white/60">. Travel smarter.</span>
        </span>
          </h1>

          <p className="mt-4 text-xs leading-relaxed text-gray-300 max-w-md">
        Create or join rides in minutes. Safe, cost-effective, and simple.
          </p>

          <div className="mt-6 flex flex-wrap gap-1">
        {["Verified sign-in", "Split fares", "Quick matches"].map((t) => (
          <span
            key={t}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80 hover:bg-white/10 transition"
          >
            {t}
          </span>
        ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 max-w-md">
        {[
          { k: "2–3x", v: "cheaper" },
          { k: "~15m", v: "setup" },
          { k: "Fewer", v: "cars" },
        ].map((s) => (
          <div key={s.k} className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="text-sm font-semibold">{s.k}</div>
            <div className="text-xs text-white/70 mt-0.5">{s.v}</div>
          </div>
        ))}
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="h-full flex items-center justify-center px-6 py-6 md:py-10">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-h-full overflow-auto md:overflow-visible">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to continue. Your next ride might be closer than you think.
          </p>

          {/* Email/Password (JWT via Credentials) */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex justify-center">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                setMode("login");
                setFormError(null);
                }}
                className={[
                "px-3 py-1 rounded-md transition",
                mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
                disabled={loading}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                setMode("signup");
                setFormError(null);
                }}
                className={[
                "px-3 py-1 rounded-md transition",
                mode === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
                disabled={loading}
              >
                Create account
              </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleJwtLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50"
                placeholder="Enter Password"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50"
                  placeholder="••••••••"
                />
              </div>
            )}

            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full rounded-md bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in with email" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="text-[11px] text-gray-500">or</div>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            aria-busy={loading}
            className="w-full group flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2.5 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                <Image
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                  width={45}
                  height={45}
                />
                Continue with Google
                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                  →
                </span>
              </>
            )}
          </button>

          <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-semibold text-gray-700">Why CarPool?</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { t: "Save money", d: "Split fuel & tolls" },
                { t: "Save time", d: "Fewer solo trips" },
                { t: "Lower emissions", d: "Share seats" },
              ].map((x) => (
                <div
                  key={x.t}
                  className="px-3 py-2 rounded-md bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition"
                  title={x.d}
                >
                  <div className="text-xs font-medium text-gray-800">{x.t}</div>
                  <div className="text-[11px] text-gray-500">{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6 text-center">
            By continuing, you agree to our Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
