"use client";

import Link from "next/link";
import ProfileMenu from "./ProfileMenu";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  isRead: boolean;
};

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setIsAuthed(false);
          return;
        }
        const session = await res.json().catch(() => null);
        const authed = Boolean(session?.user);
        if (!cancelled) setIsAuthed(authed);
      } catch {
        if (!cancelled) setIsAuthed(false);
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

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");

        // 🔐 Not logged in OR blocked by middleware
        if (!res.ok) {
          setUnreadCount(0);
          return;
        }

        // 🛡️ Empty body protection
        const text = await res.text();
        if (!text) {
          setUnreadCount(0);
          return;
        }

        const data = JSON.parse(text);

        if (Array.isArray(data)) {
          const unread = data.filter((n: Notification) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
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
