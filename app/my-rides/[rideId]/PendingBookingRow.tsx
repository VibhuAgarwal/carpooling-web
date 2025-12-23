"use client";

import { useState } from "react";

export default function PendingBookingRow({ booking }: any) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const act = async (action: "ACCEPT" | "REJECT") => {
    setLoading(true);

    await fetch("/api/bookings/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        action,
        reason,
      }),
    });

    // simplest & reliable for now
    window.location.reload();
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
          disabled={loading}
          onClick={() => act("REJECT")}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
