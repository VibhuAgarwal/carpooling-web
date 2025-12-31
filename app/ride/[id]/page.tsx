"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ToastViewport, toast } from "../../components/Toast";
import SOSButton from "@/app/components/SOSButton";

type Ride = {
  id: string;
  from: string;
  to: string;
  seatsLeft: number;
  startTime: string;
  seatsTotal: number;
  driver: {
    name: string;
    image?: string | null;
    phone?: string | null;
  };
  car?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
  } | null;
};

export default function RideDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rideId } = React.use(params);

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const startDate = useMemo(() => (ride ? new Date(ride.startTime) : null), [ride]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Uses existing list endpoint; no new API required.
        const res = await fetch("/api/rides");
        const data = await res.json();
        const found =
          Array.isArray(data) ? (data as Ride[]).find((r) => String(r.id) === String(rideId)) : null;

        if (!cancelled) setRide(found || null);
      } catch {
        if (!cancelled) toast.error("Failed to load ride details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  const requestBooking = async () => {
    if (!ride) return;

    setBooking(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: ride.id, seats: 1 }),
      });

      if (res.ok) {
        toast.success("Request sent to the driver.", "Booking requested");
      } else {
        const text = await res.text();
        try {
          const data = text ? JSON.parse(text) : null;
          toast.error(data?.error || "Booking failed");
        } catch {
          toast.error("Booking failed");
        }
      }
    } finally {
      setBooking(false);
    }
  };

  const Skeleton = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
      <div className="bg-indigo-600 p-6">
        <div className="h-3 w-20 bg-white/30 rounded mb-3" />
        <div className="h-8 w-3/4 bg-white/30 rounded mb-3" />
        <div className="h-5 w-40 bg-white/20 rounded mb-3" />
        <div className="h-8 w-2/3 bg-white/30 rounded" />
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <div className="h-3 w-10 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-56 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-2 w-full bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ToastViewport />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            ← Back to rides
          </Link>

          {/* NEW: SOS */}
          <SOSButton rideId={String(rideId)} rideFrom={ride?.from} rideTo={ride?.to} />
        </div>

        {loading ? (
          <Skeleton />
        ) : !ride ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Ride not found</h1>
            <p className="text-gray-600 mb-6">This ride may have been removed or is unavailable.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse rides
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-indigo-600 text-white p-6">
              <p className="text-sm font-medium opacity-90 mb-2">Route</p>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold break-words">{ride.from}</div>
                <div className="flex items-center gap-2 opacity-80">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold break-words">{ride.to}</div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                <img
                  src={
                    ride.driver.image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      ride.driver.name
                    )}&background=random`
                  }
                  alt={ride.driver.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 flex-shrink-0"
                />
                <div>
                  <p className="font-semibold text-gray-900">{ride.driver.name}</p>
                  <p className="text-xs text-gray-500">Driver</p>
                </div>
              </div>

              {/* NEW: Car info */}
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-900/70 mb-1">Car</p>
                <p className="text-sm font-semibold text-gray-900">
                  {ride.car?.make || ride.car?.model || ride.car?.plateNumber
                    ? `${[ride.car?.make, ride.car?.model].filter(Boolean).join(" ")}${ride.car?.plateNumber ? ` • ${ride.car.plateNumber}` : ""}`
                    : "—"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-900/70 mb-1">Departure</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {startDate
                      ? startDate.toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-900/70 mb-1">Seats</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {ride.seatsLeft} left of {ride.seatsTotal}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(ride.seatsLeft / ride.seatsTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={requestBooking}
                disabled={booking || ride.seatsLeft <= 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ride.seatsLeft <= 0 ? "No seats available" : booking ? "Requesting..." : "Request Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
