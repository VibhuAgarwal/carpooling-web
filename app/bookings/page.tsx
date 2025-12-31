"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  seats: number;
  status: string;
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
  ride: {
    from: string;
    to: string;
  };
};

export default function DriverBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const SkeletonRow = ({ i }: { i: number }) => (
    <div
      key={`dbsk-${i}`}
      className="border p-3 rounded bg-white space-y-2 animate-pulse"
    >
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
      <div className="h-3 w-24 bg-gray-100 rounded" />
      <div className="h-3 w-40 bg-gray-100 rounded" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/bookings/driver")
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (Array.isArray(data)) setBookings(data);
        else setBookings([]);
      })
      .catch(() => {
        if (!cancelled) setBookings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Booking Requests</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} i={i} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-gray-500">No booking requests yet.</p>
      ) : (
        bookings.map(b => (
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

            <p className="text-sm text-gray-600">
              Phone: <b>{b.user.phone || "—"}</b>
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
        ))
      )}
    </div>
  );
}
