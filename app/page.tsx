/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadScript } from "@react-google-maps/api";
import PlaceInput from "./components/PlaceInput";

const libs: "places"[] = ["places"];

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
  const [from, setFrom] = useState<any>(null);
  const [to, setTo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initial load → recent rides
  useEffect(() => {
    fetch("/api/rides")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setRides(data));
  }, []);

  const searchRides = async () => {
    if (!from || !to) {
      alert("Please select both locations");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/rides/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    });

    const data = await res.json();
    setRides(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={libs}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Search a Ride</h2>

          <div className="flex gap-2">
            <PlaceInput placeholder="From" onSelect={setFrom} />
            <PlaceInput placeholder="To" onSelect={setTo} />

            <button
              onClick={searchRides}
              className="bg-black text-white px-4 rounded"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
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
          <h3 className="font-semibold mb-2">
            {from && to ? "Search Results" : "Recently Posted Rides"}
          </h3>

          <div className="space-y-3">
            {rides.length === 0 && (
              <p className="text-gray-500">No rides found.</p>
            )}

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
                      if (res.ok) {
                        alert("Booking request sent");
                      } else {
                        const text = await res.text();
                        try {
                          const data = text ? JSON.parse(text) : null;
                          alert(data?.error || "Booking failed");
                        } catch {
                          alert("Booking failed");
                        }
                      }
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
    </LoadScript>
  );
}
