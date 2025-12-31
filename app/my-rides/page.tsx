"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Ride = {
  id: string;
  from: string;
  to: string;
  startTime: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  seatsLeft: number;
  seatsTotal: number;
  car?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
  } | null;
};

export default function MyRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  // Normalize potentially-string/undefined numeric fields coming from API
  const toNumber = (v: unknown, fallback = 0) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await fetch("/api/rides/my");
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized: Ride[] = data.map((r: any) => {
            const seatsTotalRaw = toNumber(r?.seatsTotal, 0);
            const seatsLeftRaw = toNumber(r?.seatsLeft, 0);

            const seatsTotal = Math.max(0, seatsTotalRaw);
            const seatsLeft = clamp(seatsLeftRaw, 0, seatsTotal || Math.max(0, seatsLeftRaw));

            return {
              id: String(r?.id ?? ""),
              from: String(r?.from ?? ""),
              to: String(r?.to ?? ""),
              startTime: String(r?.startTime ?? ""),
              status: (r?.status ?? "ACTIVE") as Ride["status"],
              seatsLeft,
              seatsTotal: seatsTotal || (seatsLeftRaw > 0 ? seatsLeftRaw : 0),
              car: r?.car
                ? {
                    make: r.car.make ?? null,
                    model: r.car.model ?? null,
                    plateNumber: r.car.plateNumber ?? null,
                  }
                : null,
            };
          });

          setRides(normalized.filter((r) => r.id));
        }
      } catch (err) {
        console.error("Failed to fetch rides:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const now = new Date();

  const active = rides.filter(
    (r) => r.status === "ACTIVE" && new Date(r.startTime) >= now
  );

  const expired = rides.filter(
    (r) => new Date(r.startTime) < now || r.status !== "ACTIVE"
  );

  const RideCard = ({ ride }: { ride: Ride }) => {
    const seatsTotalSafe = Math.max(0, toNumber(ride.seatsTotal, 0));
    const seatsLeftSafe = clamp(toNumber(ride.seatsLeft, 0), 0, seatsTotalSafe || Math.max(0, toNumber(ride.seatsLeft, 0)));
    const percentRemaining =
      seatsTotalSafe > 0 ? clamp((seatsLeftSafe / seatsTotalSafe) * 100, 0, 100) : 0;

    return (
      <Link
        href={`/my-rides/${ride.id}`}
        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1 block"
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {ride.from}
              </p>
              <div className="flex items-center gap-2 my-2 text-gray-400">
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {ride.to}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{seatsLeftSafe}</p>
              <p className="text-xs text-gray-500">{seatsLeftSafe > 1 ? "Seats Left" : "Seat Left"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">
                {new Date(ride.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(ride.startTime).toLocaleDateString([], { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                style={{ width: `${percentRemaining}%` }}
                aria-label={`Seats remaining: ${seatsLeftSafe} of ${seatsTotalSafe || "N/A"}`}
              />
            </div>
            <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              {seatsLeftSafe}/{seatsTotalSafe}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                ride.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : ride.status === "COMPLETED"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {ride.status}
            </span>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">My Rides</h1>
          <p className="text-gray-600 text-lg mt-2">Manage and monitor all your posted rides</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading your rides...</p>
          </div>
        ) : (
          <>
            {/* Active Rides */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-1 rounded-full bg-green-600"></div>
                <h2 className="text-2xl font-bold text-gray-900">Active & Upcoming</h2>
                <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {active.length}
                </span>
              </div>

              {active.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <p className="text-gray-600 text-lg">No active rides yet</p>
                  <Link href="/ride/new" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Post a Ride
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {active.map((ride) => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              )}
            </section>

            {/* Expired/Completed Rides */}
            {expired.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Expired & Completed</h2>
                  <span className="ml-auto bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {expired.length}
                  </span>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
