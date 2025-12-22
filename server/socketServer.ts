import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export function initSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log(token);
      jwt.verify(token, process.env.NEXTAUTH_SECRET!);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("BOOKING_REQUEST", (data) => {
      socket.to(`ride:${data.rideId}`).emit("BOOKING_REQUEST", data);
    });
  });

  return io;
}
