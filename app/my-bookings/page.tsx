"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
  id: string;
  seats: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  ride: {
    from: string;
    to: string;
    startTime: string;
  };
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();

        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", icon: "text-yellow-600" };
      case "ACCEPTED":
        return { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-800", icon: "text-green-600" };
      case "REJECTED":
        return { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-800", icon: "text-red-600" };
      case "CANCELLED":
        return { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-800", icon: "text-gray-600" };
      default:
        return { bg: "bg-white", border: "border-gray-200", badge: "bg-gray-100 text-gray-800", icon: "text-gray-600" };
    }
  };

  const getStatusIcon = (status: string, iconClass: string) => {
    switch (status) {
      case "PENDING":
        return <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case "ACCEPTED":
        return <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case "REJECTED":
        return <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 text-lg mt-2">Track all your ride booking requests and confirmations</p>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start by searching for and booking rides in your area</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
              Find Rides
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const config = getStatusConfig(b.status);
              return (
                <div
                  key={b.id}
                  className={`${config.bg} border-l-4 ${config.border} rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {b.ride.from} <span className="text-gray-400">→</span> {b.ride.to}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(b.ride.startTime).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={`${config.badge} px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap`}>
                        {getStatusIcon(b.status, "w-4 h-4")}
                        {b.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="inline-flex items-center gap-2 bg-white bg-opacity-60 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">{b.seats} {b.seats === 1 ? "seat" : "seats"} booked</span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      Booked {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
