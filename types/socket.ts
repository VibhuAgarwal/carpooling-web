export interface BookingRequestPayload {
  bookingId: string;
  rideId: string;

  // Some emitters may not include these yet; keep optional for compatibility.
  userId?: string;
  seats?: number;

  // Current server emitter includes route context.
  from?: string;
  to?: string;
}
