"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  seats: number;
  status: string;
  user: {
    name: string;
    email: string;
  };
  ride: {
    from: string;
    to: string;
  };
};

export default function DriverBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetch("/api/bookings/driver")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBookings(data);
      });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Booking Requests</h2>

      {bookings.length === 0 && (
        <p className="text-gray-500">No booking requests yet.</p>
      )}

      {bookings.map(b => (
  <div
    key={b.id}
    className="border p-3 rounded bg-white space-y-2"
  >
    <p className="font-medium">
      {b.user.name} requested {b.seats} seat(s)
    </p>

    <p className="text-sm text-gray-500">
      {b.ride.from} → {b.ride.to}
    </p>

    <p className="text-sm">
      Status: <b>{b.status}</b>
    </p>

    {b.status === "PENDING" && (
      <div className="flex gap-2">
        <button
          onClick={async () => {
            await fetch("/api/bookings/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: b.id,
                action: "ACCEPT",
              }),
            });
            location.reload();
          }}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Accept
        </button>

        <button
          onClick={async () => {
            await fetch("/api/bookings/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: b.id,
                action: "REJECT",
              }),
            });
            location.reload();
          }}
          className="bg-red-600 text-white px-3 py-1 rounded"
        >
          Reject
        </button>
      </div>
    )}
  </div>
))}

    </div>
  );
}
