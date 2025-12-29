"use client";

import { useEffect, useRef } from "react";
import { decodePolyline } from "@/lib/decodePolyline";

type Props = {
  polyline: string;
  pickup?: { lat: number; lng: number };
  drop?: { lat: number; lng: number };
};

export default function RouteMap({ polyline, pickup, drop }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !polyline || !mapRef.current) return;

    const path = decodePolyline(polyline);

    const map = new google.maps.Map(mapRef.current, {
      zoom: 6,
      center: path[Math.floor(path.length / 2)],
    });

    const routeLine = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#2563eb",
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });

    routeLine.setMap(map);

    if (pickup) {
      new google.maps.Marker({
        position: pickup,
        map,
        label: "S",
      });
    }

    if (drop) {
      new google.maps.Marker({
        position: drop,
        map,
        label: "D",
      });
    }
  }, [polyline, pickup, drop]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[320px] rounded-lg border"
    />
  );
}
