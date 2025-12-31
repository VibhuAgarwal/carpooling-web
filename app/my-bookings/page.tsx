"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { google?: any }
}

let googleMapsScriptPromise: Promise<void> | null = null;
const loadGoogleMaps = (apiKey: string) => {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google?.maps) return Promise.resolve();

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")));
        return;
      }

      const script = document.createElement("script");
      script.dataset.googleMaps = "true";
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps script"));
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
};

type Booking = {
  id: string;
  userId: string;
  seats: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  ride: {
    from: string;
    to: string;
    startTime: string;
    car?: {
      make?: string | null;
      model?: string | null;
      plateNumber?: string | null;
    } | null;
    driver?: { phone?: string | null } | null;
    user?: {
      phone?: string | null;
      phoneNumber?: string | null;
      mobile?: string | null;
    } | null;
  };
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapsStateRef = useRef<{ map?: any; renderer?: any } | null>(null);
  const [routeMeta, setRouteMeta] = useState<{
    distanceText?: string;
    durationText?: string;
    error?: string;
    loading?: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();

        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedBooking(null);
    };
    if (selectedBooking) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBooking]);

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      try {
        mapsStateRef.current?.renderer?.setMap?.(null);
      } catch {
        // ignore
      }
      mapsStateRef.current = null;
    };

    const run = async () => {
      if (!selectedBooking) {
        setRouteMeta(null);
        cleanup();
        return;
      }

      setRouteMeta({ loading: true });

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
      if (!apiKey) {
        setRouteMeta({
          error: "Google Maps API key missing. Set NEXT_PUBLIC_GOOGLE_MAPS_KEY to show map/ETA.",
          loading: false,
        });
        return;
      }

      const origin = selectedBooking.ride.from?.trim();
      const destination = selectedBooking.ride.to?.trim();
      if (!origin || !destination) {
        setRouteMeta({ error: "Missing origin/destination.", loading: false });
        return;
      }

      try {
        await loadGoogleMaps(apiKey);
        if (cancelled) return;

        const g = window.google;
        if (!g?.maps) throw new Error("Google Maps not available");

        if (!mapElRef.current) {
          // Modal might not have rendered yet; effect will re-run on next render.
          setRouteMeta({ error: "Map container not ready.", loading: false });
          return;
        }

        const map =
          mapsStateRef.current?.map ??
          new g.maps.Map(mapElRef.current, {
            center: { lat: 20.5937, lng: 78.9629 }, // fallback center (India)
            zoom: 5,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });

        const renderer =
          mapsStateRef.current?.renderer ??
          new g.maps.DirectionsRenderer({
            map,
            suppressMarkers: false,
            preserveViewport: false,
          });

        mapsStateRef.current = { map, renderer };

        const service = new g.maps.DirectionsService();
        service.route(
          {
            origin,
            destination,
            travelMode: g.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (cancelled) return;

            if (status !== "OK" || !result?.routes?.[0]?.legs?.[0]) {
              setRouteMeta({ error: "Could not compute route for this booking.", loading: false });
              return;
            }

            renderer.setDirections(result);

            const leg = result.routes[0].legs[0];
            setRouteMeta({
              distanceText: leg.distance?.text,
              durationText: leg.duration?.text,
              loading: false,
            });
          }
        );
      } catch (e) {
        if (cancelled) return;
        setRouteMeta({ error: "Failed to load Google Maps / compute route.", loading: false });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [selectedBooking]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", icon: "text-yellow-600" };
      case "ACCEPTED":
        return { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-800", icon: "text-green-600" };
      case "REJECTED":
        return { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-800", icon: "text-red-600" };
      case "CANCELLED":
        return { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-800", icon: "text-gray-600" };
      default:
        return { bg: "bg-white", border: "border-gray-200", badge: "bg-gray-100 text-gray-800", icon: "text-gray-600" };
    }
  };

  const getStatusIcon = (status: string, iconClass: string) => {
    switch (status) {
      case "PENDING":
        return (
          <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "ACCEPTED":
        return (
          <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "REJECTED":
        return (
          <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "CANCELLED":
        return (
          <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getContactPhone = (b: Booking): string | null => {
    const anyB = b as any;

    // Prefer explicit driver phone fields if present.
    return (
      b.ride?.driver?.phone ??
      anyB?.ride?.driver?.phone ??
      anyB?.ride?.driverPhone ??
      anyB?.ride?.driver_phone ??
      anyB?.driverPhone ??
      anyB?.driver_phone ??
      // Fall back to "ride.user" shapes (some APIs put ride owner/driver here).
      b.ride?.user?.phone ??
      b.ride?.user?.phoneNumber ??
      b.ride?.user?.mobile ??
      anyB?.ride?.user?.phone_no ??
      anyB?.ride?.user?.phoneNo ??
      null
    );
  };

  // NEW: car can be returned under different paths (often Booking.userId -> User.car).
  const getCarText = (b: Booking): string => {
    const anyB = b as any;

    const candidates = [
      b.ride?.car,
      anyB?.ride?.car,
      anyB?.user?.car,
      anyB?.user?.cars?.[0],
      anyB?.ride?.user?.car,
      anyB?.ride?.user?.cars?.[0],
      anyB?.ride?.driver?.car,
      anyB?.driver?.car,
      anyB?.car,
    ].filter(Boolean);

    const format = (car: any): string | null => {
      const make = car?.make ?? car?.brand ?? car?.manufacturer ?? car?.company ?? null;
      const model = car?.model ?? car?.name ?? car?.variant ?? null;
      const plate =
        car?.plateNumber ??
        car?.plate_number ??
        car?.registrationNumber ??
        car?.registration_number ??
        car?.numberPlate ??
        car?.number_plate ??
        null;

      const mm = [make, model].filter(Boolean).join(" ").trim();
      if (mm && plate) return `${mm} • ${plate}`;
      if (mm) return mm;
      if (plate) return plate;
      return null;
    };

    for (const c of candidates) {
      const txt = format(c);
      if (txt) return txt;
    }
    return "—";
  };

  const BookingSkeleton = ({ i }: { i: number }) => (
    <div
      key={`bsk-${i}`}
      className="bg-white border-l-4 border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 animate-pulse"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="h-8 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-8 w-56 bg-gray-100 rounded-lg mb-2" />
      <div className="h-4 w-40 bg-gray-200 rounded" />
      <div className="mt-3 h-3 w-28 bg-gray-100 rounded" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 text-lg mt-2">Track all your ride booking requests and confirmations</p>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookingSkeleton key={i} i={i} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start by searching for and booking rides in your area</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
              Find Rides
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const config = getStatusConfig(b.status);
              const carText = getCarText(b);

              return (
                <div
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedBooking(b)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedBooking(b);
                    }
                  }}
                  className={`${config.bg} border-l-4 ${config.border} rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {b.ride.from} <span className="text-gray-400">→</span> {b.ride.to}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(b.ride.startTime).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={`${config.badge} px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap`}>
                        {getStatusIcon(b.status, "w-4 h-4")}
                        {b.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    {b.status === "REJECTED" ? (
                      <div className="inline-flex items-center gap-2 bg-white bg-opacity-60 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="font-semibold">Booking cancelled</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-white bg-opacity-60 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">
                          {b.seats} {b.seats === 1 ? "seat" : "seats"} booked
                        </span>
                      </div>
                    )}

                    <span className="text-gray-500 text-xs">
                      Booked {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Car info */}
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="text-xs text-gray-500">Car: </span>
                    <span className="font-semibold text-gray-900">{carText}</span>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Click to view details
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {selectedBooking &&
          (() => {
            const b = selectedBooking;
            const config = getStatusConfig(b.status);
            const contactPhone = getContactPhone(b);
            const carText = getCarText(b);

            const gmapsDirUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
              b.ride.from
            )}&destination=${encodeURIComponent(b.ride.to)}`;

            return (
              <div
                className="fixed inset-0 z-50 overflow-y-auto"
                aria-modal="true"
                role="dialog"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setSelectedBooking(null);
                }}
              >
                <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
                    <div className={`${config.bg} border-b ${config.border} p-5 flex-shrink-0`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                            {b.ride.from} <span className="text-gray-400">→</span> {b.ride.to}
                          </h2>
                          <p className="text-sm text-gray-700 mt-1">
                            {new Date(b.ride.startTime).toLocaleString([], {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedBooking(null)}
                          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold bg-white/70 hover:bg-white border border-gray-200"
                          aria-label="Close"
                        >
                          Close
                        </button>
                      </div>

                      <div className="mt-3 inline-flex items-center gap-2">
                        <span className={`${config.badge} px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2`}>
                          {getStatusIcon(b.status, "w-4 h-4")}
                          {b.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4 overflow-y-auto">
                      {/* Map + Distance/ETA */}
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="text-sm font-semibold text-gray-900">Route</div>
                          <a
                            href={gmapsDirUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Open in Google Maps
                          </a>
                        </div>

                        <div ref={mapElRef} className="h-64 w-full bg-gray-100" />

                        <div className="px-4 py-3 border-t border-gray-200 bg-white">
                          {routeMeta?.loading ? (
                            <div className="text-sm text-gray-600">Calculating distance & ETA…</div>
                          ) : routeMeta?.error ? (
                            <div className="text-sm text-gray-700">
                              {routeMeta.error}{" "}
                              <a href={gmapsDirUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold">
                                Open directions
                              </a>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                              <div>
                                <span className="text-gray-500">Ride distance:</span>{" "}
                                <span className="font-semibold text-gray-900">{routeMeta?.distanceText ?? "—"}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">ETA:</span>{" "}
                                <span className="font-semibold text-gray-900">{routeMeta?.durationText ?? "—"}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-200 p-4">
                          <div className="text-xs text-gray-500">Seats</div>
                          <div className="text-base font-semibold text-gray-900 mt-1">
                            {b.seats} {b.seats === 1 ? "seat" : "seats"}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4">
                          <div className="text-xs text-gray-500">Booked on</div>
                          <div className="text-base font-semibold text-gray-900 mt-1">
                            {new Date(b.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Booking ID</div>
                        <div className="text-sm font-mono text-gray-900 mt-1 break-all">{b.id}</div>
                      </div>

                      {/* Rider/Driver phone (only after accepted) */}
                      {b.status === "ACCEPTED" && (
                        <div className="rounded-xl border border-gray-200 p-4">
                          <div className="text-xs text-gray-500">Rider/Driver phone</div>
                          {contactPhone ? (
                            <a
                              href={`tel:${contactPhone}`}
                              className="text-base font-semibold text-blue-600 hover:text-blue-700 mt-1 inline-block"
                            >
                              {contactPhone}
                            </a>
                          ) : (
                            <div className="text-sm text-gray-700 mt-1">
                              Not available (API is not returning a phone for the ride owner/driver on this booking).
                            </div>
                          )}
                        </div>
                      )}

                      {/* Car info */}
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Car</div>
                        <div className="text-base font-semibold text-gray-900 mt-1">{carText}</div>
                      </div>

                      {(b.status === "REJECTED" || b.status === "CANCELLED") && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                          This booking is not active.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
