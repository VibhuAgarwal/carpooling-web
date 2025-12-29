import axios from "axios";

export async function getRoutePolyline(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY missing");
    return null;
  }

  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/directions/json",
    {
      params: {
        origin: `${fromLat},${fromLng}`,
        destination: `${toLat},${toLng}`,
        mode: "driving",
        key: apiKey,
      },
    }
  );

  console.log("GOOGLE DIRECTIONS STATUS:", res.data.status);

  if (res.data.status !== "OK") {
    console.error("GOOGLE DIRECTIONS ERROR:", res.data);
    return null;
  }

  return res.data.routes[0].overview_polyline.points;
}
