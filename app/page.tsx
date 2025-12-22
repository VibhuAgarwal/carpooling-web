"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return <Link href="/dashboard/user">Go to Dashboard</Link>;
  }

  return <Link href="/login">Go to Login</Link>;
}
