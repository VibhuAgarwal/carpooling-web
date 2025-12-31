"use client";

import Link from "next/link";
import ProfileMenu from "./ProfileMenu";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  isRead: boolean;
};

// NEW: credential/token-based fallback for non-NextAuth email/password sign-in
function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = ["token", "accessToken", "authToken", "jwt"];
  for (const k of keys) {
    const v = window.localStorage.getItem(k);
    if (v && v.trim()) return v;
  }
  return null;
}

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        // 1) NextAuth-style session (OAuth etc.)
        const res = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "include",
        });

        if (res.ok) {
          const session = await res.json().catch(() => null);
          const authed = Boolean(session?.user);
          if (!cancelled) setIsAuthed(authed);
          return;
        }

        // 2) Email/password fallback (token-based apps commonly store a token in localStorage)
        const token = getClientToken();
        if (!token) {
          if (!cancelled) setIsAuthed(false);
          return;
        }

        // Optional validation if your backend exposes a "me" endpoint.
        // If you don't have this endpoint, the token presence alone will still enable the links.
        try {
          const me = await fetch("/api/auth/me", {
            cache: "no-store",
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!cancelled) setIsAuthed(me.ok);
        } catch {
          if (!cancelled) setIsAuthed(true);
        }
      } catch {
        if (!cancelled) setIsAuthed(Boolean(getClientToken()));
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authChecked || !isAuthed) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setUnreadCount(0);
          return;
        }

        const text = await res.text();
        if (!text) {
          if (!cancelled) setUnreadCount(0);
          return;
        }

        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          const unread = data.filter((n: Notification) => !n.isRead).length;
          if (!cancelled) setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        if (!cancelled) setUnreadCount(0);
      }
    };

    const onUpdated = () => fetchNotifications();

    fetchNotifications();
    window.addEventListener("notifications:updated", onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("notifications:updated", onUpdated);
    };
  }, [authChecked, isAuthed]);

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold">
          CarPool
        </Link>

        <div className="flex items-center gap-4">
          {/* Only show these when logged in (and after auth check to avoid flicker) */}
          {authChecked && isAuthed && (
            <>
              <Link href="/my-bookings" className="text-sm hover:underline">
                My Bookings
              </Link>

              <Link href="/my-rides" className="text-sm hover:underline">
                My Rides
              </Link>

              <Link
                href="/notifications"
                className="relative text-lg"
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
