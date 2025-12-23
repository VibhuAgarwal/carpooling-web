"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Ride = {
  id: string;
  from: string;
  to: string;
  startTime: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

export default function MyRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    fetch("/api/rides/my")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setRides(data));
  }, []);

  const now = new Date();

  const active = rides.filter(
    (r) => r.status === "ACTIVE" && new Date(r.startTime) >= now
  );

  const expired = rides.filter(
    (r) => new Date(r.startTime) < now || r.status !== "ACTIVE"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Rides</h1>

      <section>
        <h2 className="font-medium mb-2">Active / Upcoming</h2>
        {active.length === 0 && <p>No active rides.</p>}

        {active.map((r) => {
          if (!r.id) {
            console.error("Ride missing ID:", r);
            return null;
          }

          return (
            <Link
              key={r.id}
              href={`/my-rides/${r.id}`}
              className="block border p-3 rounded mb-2 hover:bg-gray-50"
            >
              {r.from} → {r.to} · {new Date(r.startTime).toLocaleString()}
            </Link>
          );
        })}
      </section>

      <section>
        <h2 className="font-medium mb-2">Expired / Completed</h2>
        {expired.length === 0 && <p>No past rides.</p>}

        {expired.map((r) => {
          if (!r.id) {
            console.error("Ride missing ID:", r);
            return null;
          }

          return (
           <Link
  key={r.id}
  href={`/my-rides/${r.id}`}
  className="block border p-3 rounded mb-2 hover:bg-gray-50"
>
  {r.from} → {r.to} · {new Date(r.startTime).toLocaleString()}
</Link>
          );
        })}
      </section>
    </div>
  );
}
