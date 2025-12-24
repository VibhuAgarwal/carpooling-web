"use client";

import { Autocomplete } from "@react-google-maps/api";
import { useRef } from "react";

type Place = {
  name: string;
  lat: number;
  lng: number;
};

export default function PlaceInput({
  placeholder,
  onSelect,
}: {
  placeholder: string;
  onSelect: (place: Place) => void;
}) {
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (auto: google.maps.places.Autocomplete) => {
    autoRef.current = auto;
  };

  const onPlaceChanged = () => {
    const place = autoRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    onSelect({
      name: place.formatted_address || place.name || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  };

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <input
        className="border p-2 w-full rounded"
        placeholder={placeholder}
      />
    </Autocomplete>
  );
}
