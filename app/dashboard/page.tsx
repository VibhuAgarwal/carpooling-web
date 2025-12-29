"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [greeting, setGreeting] = useState("Welcome");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTipBanner, setShowTipBanner] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    // time-based greeting
    const hour = new Date().getHours();
    const nextGreeting =
      hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    setGreeting(nextGreeting);

    // persist dismissible banner
    try {
      const dismissed = localStorage.getItem("dashboard.tip.dismissed") === "1";
      setShowTipBanner(!dismissed);
    } catch {
      setShowTipBanner(true);
    }
  }, []);

  useEffect(() => {
    // keyboard shortcuts: b -> book, p -> post, ? -> shortcuts, esc -> close modal
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || (target as any)?.isContentEditable;

      if (isTyping) return;

      if (e.key === "Escape") setShowShortcuts(false);
      if (e.key === "?") setShowShortcuts(true);
      if (e.key.toLowerCase() === "b") router.push("/");
      if (e.key.toLowerCase() === "p") router.push("/ride/new");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") return;

    if (!session?.user?.email) {
      setLoading(false);
      setError("Missing user email in session. Please sign out and sign in again.");
      return;
    }

    // Abort any previous in-flight request and start a new "latest" one.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const reqId = ++requestSeqRef.current;

    setError(null);
    setLoading(true);

    const checkProfileStatus = async () => {
      try {
        const res = await fetch("/api/auth/profile-status", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        // Ignore if a newer request started meanwhile
        if (reqId !== requestSeqRef.current) return;

        if (!res.ok) {
          let reason: string | undefined;
          try {
            const body = (await res.json()) as { reason?: string };
            reason = body?.reason;
          } catch {
            // ignore
          }

          if (res.status === 401) {
            setError("Your session expired. Please sign in again.");
            return;
          }

          throw new Error(`API returned ${res.status}${reason ? ` (${reason})` : ""}`);
        }

        const data: { isProfileComplete?: boolean } = await res.json();

        if (reqId !== requestSeqRef.current) return;

        if (data.isProfileComplete) {
          setProfileComplete(true);
          return;
        }

        router.replace("/auth/complete-profile");
      } catch (err: unknown) {
        // Abort is expected when effect re-runs (e.g., StrictMode, retry, route changes)
        if ((err as { name?: string })?.name === "AbortError") return;
        if (reqId !== requestSeqRef.current) return;

        setProfileComplete(false);
        setError(err instanceof Error ? err.message : "We couldn't verify your profile right now. Please retry.");
      } finally {
        if (reqId === requestSeqRef.current) setLoading(false);
      }
    };

    checkProfileStatus();

    return () => {
      // Abort only this request on cleanup (unmount / effect re-run)
      controller.abort();
    };
  }, [status, session?.user?.email, router, retryKey]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="inline-flex justify-center bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Retry
            </button>

            <Link
              href="/auth/complete-profile"
              className="inline-flex justify-center border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Complete profile
            </Link>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex justify-center border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileComplete) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Dismissible banner */}
        {showTipBanner && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Tip</p>
              <p className="text-sm text-gray-600">
                Use keyboard shortcuts: <span className="font-mono">b</span> (book),{" "}
                <span className="font-mono">p</span> (post),{" "}
                <span className="font-mono">?</span> (help).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowTipBanner(false);
                try {
                  localStorage.setItem("dashboard.tip.dismissed", "1");
                } catch {
                  // ignore
                }
              }}
              className="shrink-0 text-sm font-semibold text-gray-700 hover:text-gray-900"
              aria-label="Dismiss tip"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {greeting}, {session?.user?.name}!
              </h1>
              <p className="text-gray-600">Choose an option below to get started</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200 px-3 py-1 text-sm font-semibold">
                Profile verified
              </span>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="inline-flex items-center border border-gray-300 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Shortcuts (?)
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex justify-center bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Search rides (b)
            </button>
            <button
              type="button"
              onClick={() => router.push("/ride/new")}
              className="inline-flex justify-center border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Post a ride (p)
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex justify-center border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Shortcuts modal */}
        {showShortcuts && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onClick={() => setShowShortcuts(false)}
          >
            <div
              className="w-full max-w-lg rounded-lg bg-white shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Keyboard shortcuts</h2>
                  <p className="text-sm text-gray-600">Press Esc to close.</p>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                  onClick={() => setShowShortcuts(false)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-gray-900">Book a ride</span>
                  <span className="font-mono text-sm border border-gray-300 rounded px-2 py-1">b</span>
                </div>
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-gray-900">Post a ride</span>
                  <span className="font-mono text-sm border border-gray-300 rounded px-2 py-1">p</span>
                </div>
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-gray-900">Open this menu</span>
                  <span className="font-mono text-sm border border-gray-300 rounded px-2 py-1">?</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowShortcuts(false);
                    router.push("/");
                  }}
                  className="inline-flex justify-center bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Go to Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowShortcuts(false);
                    router.push("/ride/new");
                  }}
                  className="inline-flex justify-center border border-gray-300 text-gray-900 px-5 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Go to Post
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer">
            <Link href="/" className="block">
              <div className="mb-4">
                <div className="text-5xl mb-4">🚗</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Book a Ride</h2>
                <p className="text-gray-600">
                  Find and book available rides from other users in your area.
                </p>
              </div>
              <span className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
                Search Rides →
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer">
            <Link href="/ride/new" className="block">
              <div className="mb-4">
                <div className="text-5xl mb-4">📍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Post a Ride</h2>
                <p className="text-gray-600">
                  Share your ride and earn by offering seats to other users.
                </p>
              </div>
              <span className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
                Post a Ride →
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Activity</h3>
          <div className="text-center text-gray-500 py-8">
            <p>No recent activity. Start booking or posting rides!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
