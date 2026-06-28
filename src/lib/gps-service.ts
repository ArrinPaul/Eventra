import {
  getCurrentGPSPosition,
  watchGPSPosition,
  clearGPSWatch,
  getBestGPSMatch,
  isWithinCampusBounds,
} from './gps-utils';

interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface GPSOptions {
  enableHighAccuracy: boolean;
  watchInterval: number;
  maxAge: number;
}

class GPSService {
  private watchId: number | null = null;
  private lastKnownLocation: GPSPosition | null = null;
  private options: GPSOptions = {
    enableHighAccuracy: true,
    watchInterval: 5000,
    maxAge: 30000,
  };

  async getCurrentLocation(): Promise<GPSPosition> {
    const pos = await getCurrentGPSPosition({
      enableHighAccuracy: this.options.enableHighAccuracy,
      timeout: 10000,
      maximumAge: this.options.maxAge,
    });
    const position: GPSPosition = { ...pos, timestamp: Date.now() };
    this.lastKnownLocation = position;
    return position;
  }

  startWatching(
    callback: (pos: GPSPosition) => void,
    errorCallback?: (err: GeolocationPositionError) => void
  ): void {
    if (this.watchId !== null) return;

    this.watchId = watchGPSPosition(
      (pos) => {
        const position: GPSPosition = { ...pos, timestamp: Date.now() };
        this.lastKnownLocation = position;
        callback(position);
      },
      errorCallback,
      {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: 10000,
        maximumAge: this.options.maxAge,
      }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      clearGPSWatch(this.watchId);
      this.watchId = null;
    }
  }

  getLastKnownLocation(): GPSPosition | null {
    return this.lastKnownLocation;
  }

  updateOptions(options: Partial<GPSOptions>): void {
    this.options = { ...this.options, ...options };
  }

  destroy(): void {
    this.stopWatching();
    this.lastKnownLocation = null;
  }
}

let instance: GPSService | null = null;

export function getGPSService(): GPSService {
  if (!instance) {
    instance = new GPSService();
  }
  return instance;
}
