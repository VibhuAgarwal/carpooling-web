"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ToastViewport, toast } from "../components/Toast";

type Car = {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  color?: string | null;
  seats?: number | null;
};

function maskRight(value: string) {
    const v = value.trim();
    if (!v) return "—";
    
    if (v.length <= 4) return v;
    
    const start = v.slice(0, 2);
    const end = v.slice(-3);
    const masked = "•".repeat(Math.max(2, v.length - 4));
    
    return `${start}${masked}${end}`;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [carsLoading, setCarsLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    make: "",
    model: "",
    plateNumber: "",
    color: "",
    seats: "",
  });

  const canSubmit = useMemo(() => {
    return draft.make.trim() && draft.model.trim() && draft.plateNumber.trim();
  }, [draft.make, draft.model, draft.plateNumber]);

  const loadCars = async () => {
    setCarsLoading(true);
    try {
      const res = await fetch("/api/users/me/cars", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setCars(Array.isArray(data) ? data : []);
    } catch {
      setCars([]);
    } finally {
      setCarsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    loadCars();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  const addCar = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/me/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: draft.make,
          model: draft.model,
          plateNumber: draft.plateNumber,
          color: draft.color,
          seats: draft.seats,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to add car");
        return;
      }

      toast.success("Car added.", "Saved");
      setDraft({ make: "", model: "", plateNumber: "", color: "", seats: "" });
      await loadCars();
    } finally {
      setSaving(false);
    }
  };

  const deleteCar = async (id: string) => {
    try {
      const res = await fetch(`/api/users/me/cars?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Failed to delete car");
        return;
      }
      toast.success("Car removed.", "Deleted");
      await loadCars();
    } catch {
      toast.error("Failed to delete car");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <ToastViewport />
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6">
            <span aria-hidden>←</span> Back to Dashboard
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 text-lg mt-2">Manage your details and cars</p>
        </div>

        {/* User details (minimal; uses session) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Details</h2>
          {status === "loading" ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : status !== "authenticated" ? (
            <div className="text-sm text-gray-700">
              Please{" "}
              <Link className="text-blue-600 font-semibold" href="/login">
                sign in
              </Link>
              .
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Use <img> to avoid next/image remote host allowlist requirements */}
              <img
                src={
                  session.user?.image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || "User")}`
                }
                alt={session.user?.name || "User"}
                width={56}
                height={56}
                className="rounded-full object-cover border border-gray-200"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{session.user?.name}</div>
                <div className="text-sm text-gray-600 truncate">{session.user?.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* Car Details */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Car Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add cars here. Posting a ride requires selecting a car.
              </p>
            </div>
          </div>

          {/* Add car form */}
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={draft.make}
                onChange={(e) => setDraft((d) => ({ ...d, make: e.target.value }))}
                placeholder="Make (e.g., Maruti)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
              />
              <input
                value={draft.model}
                onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                placeholder="Model (e.g., Swift)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
              />
              <input
                value={draft.plateNumber}
                onChange={(e) => setDraft((d) => ({ ...d, plateNumber: e.target.value }))}
                placeholder="Plate number (e.g., KA01AB1234)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black sm:col-span-2"
              />
              <input
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                placeholder="Color (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
              />
              <input
                value={draft.seats}
                onChange={(e) => setDraft((d) => ({ ...d, seats: e.target.value }))}
                placeholder="Seats (optional)"
                type="number"
                min={1}
                max={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
              />
            </div>

            <button
              type="button"
              onClick={addCar}
              disabled={!canSubmit || saving || status !== "authenticated"}
              className="mt-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Add Car"}
            </button>
          </div>

          {/* Cars list */}
          <div className="mt-5">
            {carsLoading ? (
              <div className="text-sm text-gray-600">Loading your cars…</div>
            ) : cars.length === 0 ? (
              <div className="text-sm text-gray-700">No cars added yet.</div>
            ) : (
              <div className="space-y-3">
                {cars.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {c.make} {c.model} <span className="text-gray-500">({c.plateNumber})</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {[c.color ? `Color: ${c.color}` : null, c.seats ? `Seats: ${c.seats}` : null].filter(Boolean).join(" • ") || "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCar(c.id)}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Tip: Want to post a ride? Go to <Link className="text-blue-600 font-semibold" href="/ride/new">Post a Ride</Link>.
        </div>
      </div>
    </div>
  );
}
