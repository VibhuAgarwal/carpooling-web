"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Ride = {
  id: string;
  from: string;
  to: string;
  seatsLeft: number;
  startTime: string;
  driver: {
    name: string;
    image?: string | null;
  };
};

export default function HomePage() {
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    const fetchRides = async () => {
      const res = await fetch("/api/rides");

      if (!res.ok) {
        console.error("Failed to fetch rides");
        setRides([]);
        return;
      }

      const data = await res.json();

      // ✅ Ensure array
      if (Array.isArray(data)) {
        setRides(data);
      } else {
        console.error("Unexpected rides response:", data);
        setRides([]);
      }
    };

    fetchRides();
  }, []);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Search a Ride</h2>
        <div className="flex gap-2">
          <input className="border p-2 w-full" placeholder="From" />
          <input className="border p-2 w-full" placeholder="To" />
          <button className="bg-black text-white px-4 rounded">Search</button>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <Link
          href="/ride/new"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Post a Ride
        </Link>
      </div>

      {/* Rides */}
      <div>
        <h3 className="font-semibold mb-2">Recently Posted Rides</h3>

        <div className="space-y-3">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {ride.from} → {ride.to}
                </p>
                <p className="text-sm text-gray-500">
                  Seats left: {ride.seatsLeft} ·{" "}
                  {new Date(ride.startTime).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Driver: {ride.driver.name}
                </p>
              </div>

              <button
                onClick={async () => {
                  const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      rideId: ride.id,
                      seats: 1,
                    }),
                  });

                  if (res.ok) {
                    alert("Booking request sent");
                  } else {
                    const data = await res.json();
                    alert(data.error || "Booking failed");
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
