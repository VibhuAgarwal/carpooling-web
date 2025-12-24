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

  useEffect(() => {
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
          const unread = data.filter(
            (n: Notification) => !n.isRead
          ).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          CarPool
        </Link>

        <div className="flex items-center gap-4">
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

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
