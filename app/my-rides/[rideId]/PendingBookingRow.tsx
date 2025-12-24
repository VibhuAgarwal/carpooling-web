/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function PendingBookingRow({ booking }: any) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const act = async (action: "ACCEPT" | "REJECT") => {
    if (action === "REJECT" && !reason.trim()) {
      alert("Please provide a rejection reason");
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
        alert(data?.error || "Action failed");
      } catch {
        alert("Action failed");
      }
      return; // ❗ DO NOT reload
    }

    window.location.reload(); // only on success
  };

  return (
    <div className="border rounded p-4 flex justify-between items-start">
      <div className="flex gap-3">
        <img
          src={booking.user.image || "/avatar.png"}
          className="w-10 h-10 rounded-full"
          alt="user"
        />

        <div>
          <p className="font-medium">{booking.user.name}</p>
          <p className="text-sm text-gray-500">
            Seats requested: {booking.seats}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-end">
        <button
          disabled={loading}
          onClick={() => act("ACCEPT")}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Accept
        </button>

        <input
          placeholder="Reason (required for reject)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border px-2 py-1 text-sm rounded"
        />

        <button
          disabled={loading || !reason.trim()}
          onClick={() => act("REJECT")}
          className="bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
