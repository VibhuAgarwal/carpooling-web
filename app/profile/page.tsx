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

type MeUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const sessionUser = session?.user as any;

  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState<MeUser | null>(null);

  const [carsLoading, setCarsLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [saving, setSaving] = useState(false);

  const [editingCarId, setEditingCarId] = useState<string | null>(null);

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

  const loadMe = async () => {
    setMeLoading(true);
    try {
      const res = await fetch("/api/users/me", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMe(null);
        return;
      }
      setMe(data && typeof data === "object" ? (data as MeUser) : null);
    } catch {
      setMe(null);
    } finally {
      setMeLoading(false);
    }
  };

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
    loadMe();
    loadCars();
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  const upsertCar = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const isEditing = Boolean(editingCarId);
      const url = isEditing
        ? `/api/users/me/cars?id=${encodeURIComponent(editingCarId as string)}`
        : "/api/users/me/cars";

      const payload = {
        make: draft.make.trim(),
        model: draft.model.trim(),
        plateNumber: draft.plateNumber.trim(),
        color: draft.color.trim() || null,
        seats: draft.seats ? Number(draft.seats) : null,
      };

      let res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Fallback for backends that don't implement PATCH on this route
      if (isEditing && res.status === 405) {
        res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || (isEditing ? "Failed to update car" : "Failed to add car"));
        return;
      }

      toast.success(isEditing ? "Car Details Updated." : "Car added.", "Saved");
      setDraft({ make: "", model: "", plateNumber: "", color: "", seats: "" });
      setEditingCarId(null);
      await loadCars();
    } finally {
      setSaving(false);
    }
  };

  const startEditCar = (c: Car) => {
    setEditingCarId(c.id);
    setDraft({
      make: c.make || "",
      model: c.model || "",
      plateNumber: c.plateNumber || "",
      color: c.color || "",
      seats: c.seats != null ? String(c.seats) : "",
    });
  };

  const cancelEditCar = () => {
    setEditingCarId(null);
    setDraft({ make: "", model: "", plateNumber: "", color: "", seats: "" });
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
      if (editingCarId === id) cancelEditCar();
      await loadCars();
    } catch {
      toast.error("Failed to delete car");
    }
  };

  const SkeletonLine = ({ w = "w-full" }: { w?: string }) => (
    <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
  );

  const SkeletonCardRow = () => (
    <div className="rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
    </div>
  );

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

        {/* User details */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Details</h2>

          {status === "loading" || (status === "authenticated" && meLoading) ? (
            <div className="space-y-2">
              <SkeletonLine w="w-48" />
              <SkeletonLine w="w-64" />
              <SkeletonLine w="w-40" />
            </div>
          ) : status !== "authenticated" ? (
            <div className="text-sm text-gray-700">
              Please{" "}
              <Link className="text-blue-600 font-semibold" href="/login">
                sign in
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold text-gray-900">{me?.name ?? sessionUser?.name ?? "—"}</div>
              <div className="text-sm text-gray-600">{me?.email ?? sessionUser?.email ?? "—"}</div>
              <div className="text-sm text-gray-600">{me?.phone ?? sessionUser?.phone ?? "—"}</div>
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

          {/* Add/edit car form */}
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-sm font-semibold text-gray-900">
                {editingCarId ? "Edit car" : "Add a car"}
              </div>
              {editingCarId ? (
                <button
                  type="button"
                  onClick={cancelEditCar}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>

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
              onClick={upsertCar}
              disabled={!canSubmit || saving || status !== "authenticated"}
              className="mt-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : editingCarId ? "Save Changes" : "Add Car"}
            </button>
          </div>

          {/* Cars list */}
          <div className="mt-5">
            {carsLoading ? (
              <div className="space-y-3">
                <SkeletonCardRow />
                <SkeletonCardRow />
                <SkeletonCardRow />
              </div>
            ) : cars.length === 0 ? (
              <div className="text-sm text-gray-700">No cars added yet.</div>
            ) : (
              <div className="space-y-3">
                {cars.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {c.make} {c.model} <span className="text-gray-500">({c.plateNumber})</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {[c.color ? `Color: ${c.color}` : null, c.seats ? `Seats: ${c.seats}` : null]
                          .filter(Boolean)
                          .join(" • ") || "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditCar(c)}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCar(c.id)}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
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
