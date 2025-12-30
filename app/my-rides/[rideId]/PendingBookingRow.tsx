/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { toast } from "@/app/components/Toast";

export default function PendingBookingRow({ booking }: any) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const act = async (action: "ACCEPT" | "REJECT") => {
    if (action === "REJECT" && !reason.trim()) {
      toast.warning("Add a short reason to reject this request.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/bookings/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        action,
        reason: reason.trim(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const text = await res.text();
      try {
        const data = text ? JSON.parse(text) : null;
        toast.error(data?.error || "Action failed");
      } catch {
        toast.error("Action failed");
      }
      return;
    }

    toast.success(
      action === "ACCEPT" ? "Passenger accepted." : "Request rejected.",
      "Updated"
    );

    window.location.reload();
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <img
            src={
              booking.user.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                booking.user.name
              )}`
            }
            className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200"
            alt={booking.user.name}
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{booking.user.name}</p>
            <p className="text-sm text-gray-600">{booking.user.email}</p>
            <p className="text-sm text-gray-600">
              Phone: {booking.user.phone || "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Requesting {booking.seats}{" "}
              {booking.seats === 1 ? "seat" : "seats"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <button
            disabled={loading || showRejectForm}
            onClick={() => act("ACCEPT")}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Accept
          </button>

          <button
            onClick={() => setShowRejectForm(!showRejectForm)}
            className="text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
          >
            {showRejectForm ? "Cancel" : "Reject"}
          </button>
        </div>
      </div>

      {/* Rejection Form */}
      {showRejectForm && (
        <div className="mt-4 pt-4 border-t border-yellow-200 bg-white rounded-lg p-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rejection Reason (Required)
          </label>
          <textarea
            placeholder="Explain why you're rejecting this request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black placeholder-gray-400 resize-none h-20"
          />

          <button
            disabled={loading || !reason.trim()}
            onClick={() => act("REJECT")}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Confirm Rejection
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
