// src/types/weather.ts

export type WeatherIconType = 'sun' | 'clouds' | 'rain' | 'snow';

export interface WeatherCondition {
  code: number;
  label: string;
  icon: WeatherIconType;
  color: string;
  isSnow: boolean;
}

export interface WeatherData {
  temperature: number; // in °C
  weatherCode: number;
  condition: WeatherCondition;
  time: string;
  isDay?: boolean;
  fetchedAt: number;   // UNIX epoch ms
  source: 'live' | 'cache' | 'mock';
}

export interface LocationCoordinates {
  lat: number;
  lon: number;
  updatedAt?: number;
}
