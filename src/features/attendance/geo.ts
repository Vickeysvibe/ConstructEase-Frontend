/** Browser geolocation helpers for check-ins. */

export class GeoUnavailableError extends Error {}

export function getPosition(timeout = 20_000): Promise<GeolocationPosition> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.reject(new GeoUnavailableError("This browser can't share your location."));
  }
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout, maximumAge: 30_000 }),
  );
}

/** Plain-language reason a location fix failed. */
export function describeGeoError(err: unknown): string {
  if (err instanceof GeoUnavailableError) return "This browser can't share your location. Open ConstructEase in Chrome or Safari on your phone to check in.";
  const code = (err as { code?: number } | null)?.code;
  if (code === 1)
    return "Location permission is blocked. Allow location for this site in your browser settings (tap the lock icon by the address), then try again.";
  if (code === 2) return "Your location isn't available right now. Turn on location / GPS on your phone and try again.";
  if (code === 3) return "Finding your location took too long. Move into the open and try again.";
  return "Couldn't get your location. Try again.";
}

export const osmLink = (lat: number, lng: number) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
