// src/services/weatherService.ts

import { LocationCoordinates, WeatherCondition, WeatherData } from '../types/weather';

const WEATHER_CACHE_KEY_PREFIX = 'codriver_weather_cache_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class WeatherService {
  /**
   * WMO Weather Interpretation Code Mapping
   */
  static getWeatherCondition(code: number): WeatherCondition {
    switch (code) {
      case 0:
        return { code, label: '快晴', icon: 'sun', color: '#ff9e00', isSnow: false };
      case 1:
        return { code, label: '晴れ', icon: 'sun', color: '#ffb733', isSnow: false };
      case 2:
        return { code, label: '薄曇り', icon: 'clouds', color: '#e2c99a', isSnow: false };
      case 3:
        return { code, label: '曇り', icon: 'clouds', color: '#9c9182', isSnow: false };
      case 45:
      case 48:
        return { code, label: '霧', icon: 'clouds', color: '#a89f91', isSnow: false };
      case 51:
      case 53:
      case 55:
        return { code, label: '霧雨', icon: 'rain', color: '#60a5fa', isSnow: false };
      case 56:
      case 57:
        return { code, label: '着氷霧雨', icon: 'snow', color: '#93c5fd', isSnow: true };
      case 61:
      case 63:
      case 65:
        return { code, label: '雨', icon: 'rain', color: '#3b82f6', isSnow: false };
      case 66:
      case 67:
        return { code, label: '着氷性の雨', icon: 'snow', color: '#bfdbfe', isSnow: true };
      case 71:
        return { code, label: '小雪', icon: 'snow', color: '#e0f2fe', isSnow: true };
      case 73:
        return { code, label: '降雪', icon: 'snow', color: '#bae6fd', isSnow: true };
      case 75:
        return { code, label: '大雪', icon: 'snow', color: '#7dd3fc', isSnow: true };
      case 77:
        return { code, label: '細氷', icon: 'snow', color: '#e0f2fe', isSnow: true };
      case 80:
      case 81:
      case 82:
        return { code, label: 'にわか雨', icon: 'rain', color: '#60a5fa', isSnow: false };
      case 85:
      case 86:
        return { code, label: 'にわか雪', icon: 'snow', color: '#bae6fd', isSnow: true };
      case 95:
      case 96:
      case 99:
        return { code, label: '雷雨', icon: 'rain', color: '#f59e0b', isSnow: false };
      default:
        return { code, label: '不明', icon: 'clouds', color: '#9c9182', isSnow: false };
    }
  }

  private static readonly DEFAULT_FETCH_TIMEOUT_MS = 5000;

  /**
   * Fetch weather from Open-Meteo REST API with Stale-While-Revalidate caching
   */
  static async fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherData> {
    const cacheKey = `${WEATHER_CACHE_KEY_PREFIX}${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = this.getCache(cacheKey);

    // Return immediately if cache is fresh (< 10 minutes)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached;
    }

    // If external caller signal is already aborted, re-throw immediately
    if (signal?.aborted) {
      throw (signal.reason || new DOMException('The operation was aborted.', 'AbortError'));
    }

    // Set up internal AbortController with 5000ms default timeout to prevent indefinite hangs in tunnels
    const controller = new AbortController();
    let isTimedOut = false;

    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort(new DOMException('Weather fetch timeout (5000ms exceeded)', 'TimeoutError'));
    }, this.DEFAULT_FETCH_TIMEOUT_MS);

    // Link external abort signal if provided
    const onExternalAbort = () => {
      controller.abort(signal?.reason);
    };

    if (signal) {
      signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Open-Meteo responded with status ${response.status}`);
      }
      const data = await response.json();

      let temp = 0;
      let code = 0;
      let time = new Date().toISOString();

      // Support both legacy current_weather and modern current schema
      if (data.current_weather) {
        temp = Number(data.current_weather.temperature);
        code = Number(data.current_weather.weathercode);
        time = data.current_weather.time || time;
      } else if (data.current) {
        temp = Number(data.current.temperature_2m);
        code = Number(data.current.weather_code);
        time = data.current.time || time;
      } else if (data.hourly?.temperature_2m?.length) {
        temp = Number(data.hourly.temperature_2m[0]);
        code = Number(data.hourly.weathercode?.[0] || 0);
      }

      const weatherData: WeatherData = {
        temperature: Number(temp.toFixed(1)),
        weatherCode: code,
        condition: this.getWeatherCondition(code),
        time,
        fetchedAt: Date.now(),
        source: 'live'
      };

      this.setCache(cacheKey, weatherData);
      return weatherData;
    } catch (err: any) {
      // Re-throw only if explicitly cancelled by caller (not an internal timeout)
      if (signal?.aborted && !isTimedOut) {
        throw err;
      }

      // Offline / error: return cached data if available
      if (cached) {
        return { ...cached, source: 'cache' };
      }

      // Fallback to realistic mock weather
      return this.getMockWeather(lat, lon);
    } finally {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  /**
   * HTML5 Geolocation coordinates resolution with cached fallback
   */
  static getCurrentPosition(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by this browser.'));
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: LocationCoordinates = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            updatedAt: Date.now()
          };
          try {
            localStorage.setItem('codriver_last_coords', JSON.stringify(coords));
          } catch {
            // pass
          }
          resolve(coords);
        },
        (err) => {
          // Check cached coordinates
          try {
            const cached = localStorage.getItem('codriver_last_coords');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
                return resolve({ lat: parsed.lat, lon: parsed.lon, updatedAt: parsed.updatedAt });
              }
            }
          } catch {
            // pass
          }
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000
        }
      );
    });
  }

  /**
   * Realistic offline mock weather generator
   */
  static getMockWeather(lat: number, lon: number): WeatherData {
    const isSkiArea = lat > 35.5 && lon > 136.5;
    const temp = isSkiArea ? -2.5 : 14.0;
    const code = isSkiArea ? 73 : 0; // 73: 降雪, 0: 快晴

    return {
      temperature: temp,
      weatherCode: code,
      condition: this.getWeatherCondition(code),
      time: new Date().toISOString(),
      fetchedAt: Date.now(),
      source: 'mock'
    };
  }

  private static getCache(key: string): WeatherData | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private static setCache(key: string, data: WeatherData): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // pass
    }
  }
}
