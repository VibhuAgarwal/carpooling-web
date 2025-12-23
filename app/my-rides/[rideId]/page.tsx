import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PendingBookingRow from "./PendingBookingRow";

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
            },
          },
        },
      },
    },
  });

  if (!ride || ride.driverId !== session.user.id) {
    redirect("/my-rides");
  }

  const accepted = ride.bookings.filter(
    (b) => b.status === "ACCEPTED"
  );

  const pending = ride.bookings.filter(
  (b) => b.status === "PENDING"
);


  const rejected = ride.bookings.filter(
    (b) => b.status === "REJECTED"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Ride Summary */}
      <section className="bg-white border rounded p-5">
        <h1 className="text-xl font-semibold">
          {ride.from} → {ride.to}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          {new Date(ride.startTime).toLocaleString()}
        </p>

        <div className="flex gap-6 mt-3 text-sm">
          <span>
            <strong>Seats:</strong> {ride.seatsLeft} / {ride.seatsTotal}
          </span>
          <span>
            <strong>Status:</strong> {ride.status}
          </span>
        </div>
      </section>

      {/* Accepted Passengers */}
      <section className="bg-white border rounded p-5">
        <h2 className="text-lg font-medium mb-3">
          Accepted Passengers
        </h2>

        {accepted.length === 0 && (
          <p className="text-gray-500">
            No passengers accepted yet.
          </p>
        )}

        <div className="space-y-3">
          {accepted.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={b.user.image || "/avatar.png"}
                  className="w-10 h-10 rounded-full"
                  alt="user"
                />

                <div>
                  <p className="font-medium">{b.user.name}</p>
                  <p className="text-sm text-gray-500">
                    Seats: {b.seats}
                  </p>
                </div>
              </div>

              <span className="text-green-600 text-sm font-medium">
                Accepted
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Requests */}
<section className="bg-white border rounded p-5">
  <h2 className="text-lg font-medium mb-3">
    Pending Requests
  </h2>

  {pending.length === 0 && (
    <p className="text-gray-500">No pending requests.</p>
  )}

  <div className="space-y-4">
    {pending.map((b) => (
      <PendingBookingRow key={b.id} booking={b} />
    ))}
  </div>
</section>


      {/* Rejected Requests */}
      <section className="bg-white border rounded p-5">
        <h2 className="text-lg font-medium mb-3">
          Rejected Requests
        </h2>

        {rejected.length === 0 && (
          <p className="text-gray-500">
            No rejected requests.
          </p>
        )}

        <div className="space-y-3">
          {rejected.map((b) => (
            <div
              key={b.id}
              className="border rounded p-3 bg-gray-50"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{b.user.name}</p>
                  <p className="text-sm text-gray-500">
                    Seats requested: {b.seats}
                  </p>
                </div>

                <span className="text-red-600 text-sm font-medium">
                  Rejected
                </span>
              </div>

              {b.reason && (
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Reason:</strong> {b.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
