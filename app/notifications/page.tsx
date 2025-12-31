"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  rideId?: string | null; // NEW
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // NEW: map notification to a ride page
  const getNotificationHref = (n: Notification) => {
    if (!n.rideId) return null;

    // Driver-centric notifications typically want the manage page
    if (n.type === "BOOKING_RECEIVED") return `/my-rides/${n.rideId}`;

    // Everyone else can view the ride details
    return `/ride/${n.rideId}`;
  };

  // NEW: optimistic mark-as-read + notify navbar badge (do NOT revert on failure)
  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    } catch (e) {
      // keep optimistic UI; server may not support this endpoint yet
      console.error("Failed to mark notification read (kept optimistic UI):", e);
    } finally {
      window.dispatchEvent(new Event("notifications:updated"));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "BOOKING_SENT":
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case "BOOKING_RECEIVED":
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case "BOOKING_ACCEPTED":
        return (
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "BOOKING_REJECTED":
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Notifications
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Stay updated on your bookings and rides
          </p>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600 mb-6">
              You're all caught up! Check back later for updates on your rides and
              bookings.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Rides
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const href = getNotificationHref(n);

              const handleOpen = async () => {
                if (!n.isRead) await markRead(n.id);
                if (href) router.push(href);
              };

              return (
                <button
                  key={n.id}
                  type="button"
                  aria-label={href ? "Open related ride" : "Mark notification as read"}
                  onClick={handleOpen}
                  className={`w-full text-left rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex items-start gap-4 p-4 sm:p-5 border-l-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    n.isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-600"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm sm:text-base font-medium ${
                        n.isRead ? "text-gray-700" : "text-gray-900 font-semibold"
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {new Date(n.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {href ? " • View ride" : ""}
                    </p>
                  </div>

                  {!n.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
