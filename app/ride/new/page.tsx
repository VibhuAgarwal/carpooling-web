/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadScript } from "@react-google-maps/api";
import PlaceInput from "../../components/PlaceInput";

const libs: ("places")[] = ["places"];

export default function PostRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [from, setFrom] = useState<any>(null);
  const [to, setTo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!from || !to) {
      alert("Please select valid locations");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from.name,
        fromLat: from.lat,
        fromLng: from.lng,

        to: to.name,
        toLat: to.lat,
        toLng: to.lng,

        seatsTotal: Number(formData.get("seats")),
        startTime: formData.get("startTime"),
      }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      alert(data.error || "Failed to post ride");
    }

    setLoading(false);
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={libs}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4"
      >
        <h2 className="text-lg font-semibold">Post a Ride</h2>

        <PlaceInput placeholder="From" onSelect={setFrom} />
        <PlaceInput placeholder="To" onSelect={setTo} />

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
    </LoadScript>
  );
}
