import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (io) return io;

  io = new IOServer(server, {
    path: "/api/socket",
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("join-user", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
