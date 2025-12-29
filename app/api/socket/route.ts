import { NextRequest } from "next/server";
import { initSocket } from "@/lib/socket";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const server = (req as any).socket?.server;

  if (!server.io) {
    server.io = initSocket(server);
  }

  return new Response("Socket initialized", { status: 200 });
}
