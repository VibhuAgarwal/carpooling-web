"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { getSocket } from "@/lib/socketClient";

export default function SocketProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = getSocket();
    socket.emit("join-user", session.user.id);
  }, [session?.user?.id]);

  return null;
}
