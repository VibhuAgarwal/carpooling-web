"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: formData.get("from"),
        to: formData.get("to"),
        seatsTotal: formData.get("seats"),
        startTime: formData.get("startTime"),
      }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      alert("Failed to post ride");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-3"
    >
      <h2 className="text-lg font-semibold">Post a Ride</h2>

      <input
        name="from"
        placeholder="From"
        className="border p-2 w-full"
        required
      />

      <input
        name="to"
        placeholder="To"
        className="border p-2 w-full"
        required
      />

      <input
        name="seats"
        type="number"
        min={1}
        placeholder="Seats"
        className="border p-2 w-full"
        required
      />

      <input
        name="startTime"
        type="datetime-local"
        className="border p-2 w-full"
        required
      />

      <button
        disabled={loading}
        className="bg-black text-white w-full py-2 rounded"
      >
        {loading ? "Posting..." : "Publish Ride"}
      </button>
    </form>
  );
}
