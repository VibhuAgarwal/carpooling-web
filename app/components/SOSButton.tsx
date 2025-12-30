"use client";

import * as React from "react";
import { toast } from "./Toast";

type Props = {
  rideId?: string;
  rideFrom?: string;
  rideTo?: string;
  className?: string;
};

type Coords = { lat: number; lng: number; accuracy?: number };

const LS_KEY = "emergency.contact.phone";

function formatPhone(raw: string) {
  // keep + and digits only
  return raw.trim().replace(/[^\d+]/g, "");
}

export default function SOSButton({ rideId, rideFrom, rideTo, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [watching, setWatching] = React.useState(false);
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const [phone, setPhone] = React.useState("");
  const watchIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem(LS_KEY) || "";
      setPhone(saved);
    } catch {
      // ignore
    }
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch?.(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const mapsUrl = React.useMemo(() => {
    if (!coords) return "";
    return `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
  }, [coords]);

  const messageText = React.useMemo(() => {
    const parts = [
      "SOS: I need help.",
      rideFrom && rideTo ? `Ride: ${rideFrom} → ${rideTo}` : undefined,
      rideId ? `Ride ID: ${rideId}` : undefined,
      coords ? `My location: ${mapsUrl}` : "My location: (starting live location...)",
    ].filter(Boolean) as string[];

    return parts.join("\n");
  }, [coords, mapsUrl, rideFrom, rideTo, rideId]);

  const startLiveLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    if (watchIdRef.current !== null) return;

    try {
      setWatching(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          setWatching(false);
          watchIdRef.current = null;
          toast.error(err?.message || "Unable to access location. Check browser permissions.");
        },
        { enableHighAccuracy: true, maximumAge: 2_000, timeout: 15_000 }
      );

      toast.success("Live location started. Use “Share / Copy” to send your latest location.", "SOS");
    } catch {
      setWatching(false);
      watchIdRef.current = null;
      toast.error("Unable to start live location.");
    }
  };

  const stopLiveLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch?.(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
    toast.info("Live location stopped.");
  };

  const shareOrCopy = async () => {
    if (!coords) {
      toast.info("Waiting for location fix…");
      return;
    }

    try {
      // Prefer Web Share API when available.
      const canShare = typeof navigator !== "undefined" && "share" in navigator;
      if (canShare) {
        // @ts-expect-error - TS lib dom typings may vary
        await navigator.share({ title: "SOS", text: messageText, url: mapsUrl });
        toast.success("Shared.", "SOS");
        return;
      }

      await navigator.clipboard.writeText(messageText);
      toast.success("Copied SOS message to clipboard.", "SOS");
    } catch {
      toast.error("Failed to share/copy. Try again.");
    }
  };

  const savePhone = () => {
    const normalized = formatPhone(phone);
    if (!normalized) {
      toast.warning("Enter a valid phone number.");
      return;
    }
    setPhone(normalized);
    try {
      localStorage.setItem(LS_KEY, normalized);
    } catch {
      // ignore
    }
    toast.success("Emergency contact saved.", "SOS");
  };

  const callEmergencyContact = () => {
    const normalized = formatPhone(phone);
    if (!normalized) {
      toast.warning("Add an emergency contact number first.");
      return;
    }
    // Initiate phone call on supported devices.
    window.location.href = `tel:${normalized}`;
  };

  const callEmergencyServices = () => {
    // Conservative default; user can still change their emergency contact for local needs.
    window.location.href = "tel:112";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition"
        }
        aria-label="Open SOS emergency options"
      >
        {/* icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A2 2 0 004.5 20h15a2 2 0 001.71-3.14l-7.5-13a2 2 0 00-3.42 0z" />
        </svg>
        SOS
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="SOS emergency actions"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">SOS</h2>
                <p className="text-sm text-gray-600">
                  Start live location, then share/copy your latest location, or call your emergency contact.
                </p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startLiveLocation}
                    disabled={watching}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                  >
                    Start live location
                  </button>

                  <button
                    type="button"
                    onClick={stopLiveLocation}
                    disabled={!watching}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Stop
                  </button>

                  <button
                    type="button"
                    onClick={shareOrCopy}
                    disabled={!coords}
                    className="ml-auto inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50"
                  >
                    Share / Copy latest
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  <div>
                    Status:{" "}
                    <span className="font-semibold text-gray-900">{watching ? "Live" : "Not sharing"}</span>
                  </div>
                  <div className="mt-1 break-words">
                    {coords ? (
                      <>
                        Location:{" "}
                        <a className="text-blue-700 hover:text-blue-800 underline" href={mapsUrl} target="_blank" rel="noreferrer">
                          {mapsUrl}
                        </a>
                        {typeof coords.accuracy === "number" ? (
                          <span className="text-gray-500"> (±{Math.round(coords.accuracy)}m)</span>
                        ) : null}
                      </>
                    ) : (
                      "Location: —"
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency contact phone</label>
                <div className="flex gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                  />
                  <button
                    type="button"
                    onClick={savePhone}
                    className="px-3 py-2 rounded-lg font-semibold border border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    Save
                  </button>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={callEmergencyContact}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  >
                    Call emergency contact
                  </button>
                  <button
                    type="button"
                    onClick={callEmergencyServices}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold border border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    Call emergency services (112)
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Note: Calling uses <code className="font-mono">tel:</code> and works best on mobile devices.
                </p>
              </div>

              <details className="rounded-xl border border-gray-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-gray-900">Preview SOS message</summary>
                <pre className="mt-3 whitespace-pre-wrap text-xs text-gray-700">{messageText}</pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
