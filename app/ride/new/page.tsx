/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlaceInput from "../../components/PlaceInput";
import Link from "next/link";
import { ToastViewport, toast } from "../../components/Toast";

type Car = {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  color?: string | null;
  seats?: number | null;
};

export default function PostRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [from, setFrom] = useState<any>(null);
  const [to, setTo] = useState<any>(null);

  // NEW: cars + selected car
  const [carsLoading, setCarsLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<string>("");

  const carOptions = useMemo(
    () =>
      cars.map((c) => ({
        value: c.id,
        label: `${c.make} ${c.model} (${c.plateNumber})`,
      })),
    [cars]
  );

  const selectedCar = useMemo(
    () => cars.find((c) => String(c.id) === String(carId)) ?? null,
    [cars, carId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCarsLoading(true);
      try {
        const res = await fetch("/api/users/me/cars", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setCars([]);
          return;
        }
        const data = await res.json();
        const nextCars = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setCars(nextCars);
          // NEW: pick first car by default
          if (!carId && nextCars.length > 0) setCarId(String(nextCars[0].id));
        }
      } catch {
        if (!cancelled) setCars([]);
      } finally {
        if (!cancelled) setCarsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // fetch once; don't refetch on carId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!from || !to) {
      toast.info("Select valid From and To locations before posting.");
      return;
    }

    if (!carId) {
      toast.info("Please choose a car to post this ride.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const seatsTotal = Number(formData.get("seats"));

    if (selectedCar?.seats != null && Number.isFinite(selectedCar.seats) && seatsTotal > selectedCar.seats) {
      toast.info(`Selected car has ${selectedCar.seats} seats. Please lower seats to continue.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from.name,
          fromLat: from.lat,
          fromLng: from.lng,
          to: to.name,
          toLat: to.lat,
          toLng: to.lng,
          seatsTotal,
          startTime: formData.get("startTime"),
          carId,
          // NEW: also send car details for backend compatibility
          car: selectedCar
            ? {
                make: selectedCar.make,
                model: selectedCar.model,
                plateNumber: selectedCar.plateNumber,
                color: selectedCar.color ?? null,
                seats: selectedCar.seats ?? null,
              }
            : null,
        }),
      });

      if (res.ok) {
        toast.success("Your ride is live.", "Ride posted");
        router.push("/");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to post ride");
      }
    } catch {
      toast.error("Failed to post ride. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const SkeletonLine = ({ w = "w-full" }: { w?: string }) => (
    <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <ToastViewport />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Rides
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">Post a Ride</h1>
          <p className="text-gray-600 text-lg">Share your journey and help others save on commute costs</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6"
        >
          {/* Route Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Route Details
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                <PlaceInput placeholder="Departure location" onSelect={setFrom} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                <PlaceInput placeholder="Destination" onSelect={setTo} />
              </div>
            </div>
          </div>

          {/* Ride Details Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ride Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="seats" className="block text-sm font-semibold text-gray-700 mb-2">
                  Available Seats
                </label>
                <input
                  id="seats"
                  name="seats"
                  type="number"
                  min={1}
                  max={8}
                  placeholder="Number of seats"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 font-medium"
                  required
                />
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  Departure Date & Time
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
            </div>
          </div>

          {/* NEW: Car selection */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M7 17a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
              </svg>
              Car
            </h2>

            {carsLoading ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3">
                  <SkeletonLine w="w-32" />
                </div>
                <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
                <div className="mt-3">
                  <SkeletonLine w="w-48" />
                </div>
              </div>
            ) : cars.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
                No cars found in your profile.{" "}
                <Link href="/profile" className="font-semibold text-blue-700 hover:text-blue-800">
                  Add a car
                </Link>{" "}
                to post a ride.
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose a car</label>
                <select
                  value={carId}
                  onChange={(e) => setCarId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="" disabled>
                    Select a car
                  </option>
                  {carOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-900">
              Make sure your departure time is at least 1 hour from now. Users will see your ride and can request seats immediately.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !from || !to || !carId || carsLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Publish Ride
                </>
              )}
            </button>
            
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
