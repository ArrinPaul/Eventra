import { CAMPUS_LOCATIONS, CampusLocation } from './campus-locations';

const EARTH_RADIUS_M = 6371000;

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function findNearestLocations(
  userLat: number,
  userLng: number
): Array<{ location: CampusLocation; distance: number; confidence: number }> {
  return CAMPUS_LOCATIONS.map((loc) => {
    const distance = calculateDistance(userLat, userLng, loc.lat, loc.lng);
    const confidence = Math.max(0, 1 - distance / 500);
    return { location: loc, distance, confidence };
  }).sort((a, b) => a.distance - b.distance);
}

export function getBestGPSMatch(
  userLat: number,
  userLng: number,
  maxDistance: number = 500
): { location: CampusLocation; distance: number; confidence: number } | null {
  const nearest = findNearestLocations(userLat, userLng);
  if (nearest.length === 0 || nearest[0].distance > maxDistance) return null;
  return nearest[0];
}

export function isWithinCampusBounds(lat: number, lng: number, bufferMeters: number = 200): boolean {
  const lats = CAMPUS_LOCATIONS.map((l) => l.lat);
  const lngs = CAMPUS_LOCATIONS.map((l) => l.lng);
  const minLat = Math.min(...lats) - bufferMeters / 111320;
  const maxLat = Math.max(...lats) + bufferMeters / 111320;
  const minLng = Math.min(...lngs) - bufferMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const maxLng = Math.max(...lngs) + bufferMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

export async function checkGPSPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'denied';
  try {
    const result = await new Promise<PermissionStatus>((resolve, reject) => {
      navigator.permissions.query({ name: 'geolocation' }).then(resolve).catch(reject);
    });
    return result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function getCurrentGPSPosition(
  options?: PositionOptions
): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000, ...options }
    );
  });
}

export function watchGPSPosition(
  callback: (pos: { lat: number; lng: number; accuracy: number }) => void,
  errorCallback?: (err: GeolocationPositionError) => void,
  options?: PositionOptions
): number | null {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return navigator.geolocation.watchPosition(
    (pos) => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
    (err) => errorCallback?.(err),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000, ...options }
  );
}

export function clearGPSWatch(watchId: number): void {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}
