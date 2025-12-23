"use client";

import { useEffect, useState } from "react";

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
      const res = await fetch("/api/bookings");
      const data = await res.json();

      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        setBookings([]);
      }

      setLoading(false);
    };

    fetchBookings();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading bookings...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">My Bookings</h1>

      {bookings.length === 0 && (
        <p className="text-gray-500">
          You haven’t booked any rides yet.
        </p>
      )}

      {bookings.map((b) => (
        <div
          key={b.id}
          className="border rounded p-4 bg-white flex justify-between"
        >
          <div>
            <p className="font-medium">
              {b.ride.from} → {b.ride.to}
            </p>

            <p className="text-sm text-gray-500">
              {new Date(b.ride.startTime).toLocaleString()}
            </p>

            <p className="text-sm text-gray-500">
              Seats booked: {b.seats}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded text-sm font-medium self-start ${
              b.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : b.status === "ACCEPTED"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {b.status}
          </span>
        </div>
      ))}
    </div>
  );
}
