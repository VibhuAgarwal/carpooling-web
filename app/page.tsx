/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlaceInput from "./components/PlaceInput";

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
  const [activeTab, setActiveTab] = useState<"recent" | "search">("recent");

  // Helper to filter expired rides and optionally limit
  const processRides = (rides: Ride[], limit?: number) => {
    const now = new Date();
    const filtered = rides.filter((ride) => new Date(ride.startTime) > now);
    return limit ? filtered.slice(0, limit) : filtered;
  };

  // Initial load → recent rides (filtered and limited to 5)
  useEffect(() => {
    fetch("/api/rides")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setRides(processRides(data, 5)));
  }, []);

  const searchRides = async () => {
    if (!from || !to) {
      alert("Please select both locations");
      return;
    }

    setLoading(true);
    setActiveTab("search");

    const res = await fetch("/api/rides/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    });

    const data = await res.json();
    setRides(processRides(Array.isArray(data) ? data : []));
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchRides();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Find Your Ride
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Connect with commuters traveling in your direction. Save money, reduce carbon footprint, make new friends.
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    From
                  </label>
                  <div className="text-black">
                    <PlaceInput placeholder="Departure" onSelect={setFrom} />
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    To
                  </label>
                  <div className="text-black">
                    <PlaceInput placeholder="Destination" onSelect={setTo} />
                  </div>
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <button
                    onClick={searchRides}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <Link
                    href="/ride/new"
                    className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post Ride
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("recent")}
            className={`pb-4 px-4 font-semibold transition-all duration-300 ${
              activeTab === "recent"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Rides
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`pb-4 px-4 font-semibold transition-all duration-300 ${
              activeTab === "search"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Results
          </button>
        </div>

        {/* Rides Grid */}
        <div>
          {rides.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rides found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or check back later</p>
              <Link
                href="/ride/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post a Ride
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rides.map((ride, index) => (
                <div
                  key={ride.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium opacity-90 mb-1">Route</p>
                        <p className="text-lg sm:text-xl font-bold">{ride.from}</p>
                        <div className="flex items-center gap-2 my-2 opacity-75">
                          <div className="w-1 h-1 rounded-full bg-white"></div>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <div className="w-1 h-1 rounded-full bg-white"></div>
                        </div>
                        <p className="text-lg sm:text-xl font-bold">{ride.to}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{ride.seatsLeft}</p>
                        <p className="text-xs opacity-90">Seats</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    {/* Driver Info */}
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <img
                        src={ride.driver.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride.driver.name)}&background=random`}
                        alt={ride.driver.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{ride.driver.name}</p>
                        <p className="text-xs text-gray-500">Driver</p>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(ride.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(ride.startTime).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Seats Status */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(ride.seatsLeft / 5) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        {ride.seatsLeft === 1
                          ? "Only 1 seat left!"
                          : `${ride.seatsLeft} seats available`}
                      </p>
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="px-4 pb-4">
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
                          alert("✓ Booking request sent!");
                        } else {
                          const text = await res.text();
                          try {
                            const data = text ? JSON.parse(text) : null;
                            alert(data?.error || "Booking failed");
                          } catch {
                            alert("Booking failed");
                          }
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                    >
                      <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3L8 20H4v-4l12-15z" />
                      </svg>
                      Request Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .group:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
