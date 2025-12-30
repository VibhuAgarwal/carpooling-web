import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PendingBookingRow from "./PendingBookingRow";
import RouteMap from "@/app/components/RouteMap";
import { ToastViewport } from "@/app/components/Toast";
import SOSButton from "@/app/components/SOSButton";

export default async function RideDetailsPage({
  params,
}: {
  params: Promise<{ rideId?: string }>;
}) {
  const { rideId } = await params;

  if (!rideId || rideId === "undefined") {
    redirect("/my-rides");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      bookings: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!ride || ride.driverId !== session.user.id) {
    redirect("/my-rides");
  }

  const hasCoords =
    ride.fromLat !== null &&
    ride.fromLng !== null &&
    ride.toLat !== null &&
    ride.toLng !== null;

  const accepted = ride.bookings.filter((b) => b.status === "ACCEPTED");
  const pending = ride.bookings.filter((b) => b.status === "PENDING");
  const rejected = ride.bookings.filter((b) => b.status === "REJECTED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <ToastViewport />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <Link
            href="/my-rides"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to My Rides
          </Link>

          {/* NEW: SOS */}
          <SOSButton rideId={rideId} rideFrom={ride.from} rideTo={ride.to} />
        </div>

        {/* Ride Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Route Map */}
          {ride.routePolyline && hasCoords && (
            <div className="h-80 w-full">
              <RouteMap
                polyline={ride.routePolyline}
                pickup={{ lat: ride.fromLat!, lng: ride.fromLng! }}
                drop={{ lat: ride.toLat!, lng: ride.toLng! }}
              />
            </div>
          )}

          {/* Ride Info */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {ride.from}
                  <span className="text-gray-400 mx-3">→</span>
                  {ride.to}
                </h1>
                <p className="text-lg text-gray-600 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {new Date(ride.startTime).toLocaleDateString([], {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                  {" at "}
                  {new Date(ride.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="text-right bg-white rounded-xl p-4 shadow-md">
                <p className="text-4xl font-bold text-blue-600">
                  {ride.seatsLeft}
                </p>
                <p className="text-sm text-gray-600">Seats Left</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {ride.seatsTotal}
                </p>
                <p className="text-xs text-gray-600">Total Seats</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {accepted.length}
                </p>
                <p className="text-xs text-gray-600">Accepted</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {pending.length}
                </p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {rejected.length}
                </p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                  ride.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : ride.status === "COMPLETED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {ride.status}
              </span>
            </div>
          </div>
        </div>

        {/* Bookings Sections */}
        <div className="grid grid-cols-1 gap-6">
          {/* Accepted Passengers */}
          <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Accepted Passengers
              </h2>
              <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {accepted.length}
              </span>
            </div>

            {accepted.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3.545a1.5 1.5 0 01-1.5-1.5V5.455a1.5 1.5 0 011.5-1.5h15a1.5 1.5 0 011.5 1.5v12.545a1.5 1.5 0 01-1.5 1.5z"
                  />
                </svg>
                <p className="text-gray-600">No passengers accepted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accepted.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          b.user.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            b.user.name
                          )}`
                        }
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                        alt={b.user.name}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {b.user.name}
                        </p>
                        <p className="text-sm text-gray-600">{b.user.email}</p>
                        <p className="text-sm text-gray-600">
                          Phone: {b.user.phone || "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Seats: {b.seats}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-semibold text-green-700">
                        Accepted
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending Requests */}
          <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Pending Requests
              </h2>
              <span className="ml-auto bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                {pending.length}
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-600">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((b) => (
                  <PendingBookingRow key={b.id} booking={b} />
                ))}
              </div>
            )}
          </section>

          {/* Rejected Requests */}
          {rejected.length > 0 && (
            <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Rejected Requests
                </h2>
                <span className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {rejected.length}
                </span>
              </div>

              <div className="space-y-3">
                {rejected.map((b) => (
                  <div
                    key={b.id}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            b.user.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              b.user.name
                            )}`
                          }
                          className="w-12 h-12 rounded-full object-cover border-2 border-red-200"
                          alt={b.user.name}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {b.user.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Requested {b.seats}{" "}
                            {b.seats === 1 ? "seat" : "seats"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Phone: {b.user.phone || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-semibold text-red-700">
                            Rejected
                          </span>
                        </div>
                        {b.reason && (
                          <p className="text-xs text-gray-600 max-w-xs text-right">
                            <strong>Reason:</strong> {b.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
