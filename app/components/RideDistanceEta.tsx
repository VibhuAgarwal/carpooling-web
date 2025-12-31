"use client";

import * as React from "react";

type Props = {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  startTime: string | Date;
  className?: string;
  travelMode?: google.maps.TravelMode; // default DRIVING
};

type State =
  | { status: "idle" | "loading" }
  | { status: "ready"; distanceText: string; durationText: string; arrivalTime: Date }
  | { status: "error"; message: string };

function hasGoogle(): boolean {
  return typeof window !== "undefined" && !!(window as any).google?.maps;
}

export default function RideDistanceEta({
  from,
  to,
  startTime,
  className,
  travelMode,
}: Props) {
  const [state, setState] = React.useState<State>({ status: "idle" });

  React.useEffect(() => {
    if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return;

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      setState({ status: "error", message: "Invalid start time" });
      return;
    }

    if (!hasGoogle()) {
      setState({ status: "error", message: "Google Maps not loaded" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    const svc = new google.maps.DirectionsService();
    svc.route(
      {
        origin: new google.maps.LatLng(from.lat, from.lng),
        destination: new google.maps.LatLng(to.lat, to.lng),
        travelMode: travelMode ?? google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;

        if (status !== "OK" || !result?.routes?.[0]?.legs?.[0]) {
          setState({ status: "error", message: `Directions failed (${status})` });
          return;
        }

        const leg = result.routes[0].legs[0];
        const dist = leg.distance;
        const dur = leg.duration;

        if (!dist?.text || !dur?.text || typeof dur?.value !== "number") {
          setState({ status: "error", message: "Missing distance/duration" });
          return;
        }

        const arrival = new Date(start.getTime() + dur.value * 1000);
        setState({
          status: "ready",
          distanceText: dist.text,
          durationText: dur.text,
          arrivalTime: arrival,
        });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [from.lat, from.lng, to.lat, to.lng, startTime, travelMode]);

  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <div className={className || "mt-4"}>
        <div className="bg-white rounded-lg p-3 text-sm text-gray-600 border border-gray-200">
          Calculating distance & ETA…
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={className || "mt-4"}>
        <div className="bg-white rounded-lg p-3 text-sm text-gray-600 border border-gray-200">
          Distance/ETA unavailable
          <span className="text-gray-400"> • {state.message}</span>
        </div>
      </div>
    );
  }

  if (state.status !== "ready") return null;

  return (
    <div className={className || "mt-4"}>
      <div className="bg-white rounded-lg p-3 text-sm text-gray-700 border border-gray-200 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          <span className="font-semibold text-gray-900">Distance:</span> {state.distanceText}
        </span>
        <span>
          <span className="font-semibold text-gray-900">Duration:</span> {state.durationText}
        </span>
        <span>
          <span className="font-semibold text-gray-900">ETA (arrival):</span>{" "}
          {state.arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
