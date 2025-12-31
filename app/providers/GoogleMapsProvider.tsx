"use client";

import { LoadScript } from "@react-google-maps/api";

export default function GoogleMapsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}
      libraries={["places", "routes"]}
      loadingElement={
        <div className="min-h-[120px] rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-64 bg-gray-100 rounded" />
        </div>
      }
    >
      {children}
    </LoadScript>
  );
}
