// src/types/spot.ts

export interface SkiSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  pref?: string;
  order: number;
}

export interface SpotFormData {
  name: string;
  lat: string | number;
  lon: string | number;
}
