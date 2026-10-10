// src/services/spotStorageService.ts

import { SkiSpot, SpotFormData } from '../types/spot';
import { validateSpotInput, ValidationResult } from '../utils/validation';

export const SPOT_STORAGE_KEY = 'codriver_spots_v1';
export const ACTIVE_SPOT_ID_KEY = 'codriver_active_spot_id_v1';

export const INITIAL_SKI_SPOTS: SkiSpot[] = [
  { id: 'spot-1', name: 'やぶはら高原スキー場', lat: 35.9611, lon: 137.7294, pref: '長野県', order: 0 },
  { id: 'spot-2', name: '高鷲スノーパーク', lat: 35.9980, lon: 136.8772, pref: '岐阜県', order: 1 },
  { id: 'spot-3', name: 'ダイナランド', lat: 35.9907, lon: 136.8697, pref: '岐阜県', order: 2 },
  { id: 'spot-4', name: 'よませ温泉スキー場', lat: 36.7906, lon: 138.4111, pref: '長野県', order: 3 },
  { id: 'spot-5', name: '白馬岩岳マウンテンリゾート', lat: 36.7287, lon: 137.8402, pref: '長野県', order: 4 }
];

export class SpotStorageService {
  static getSpots(): SkiSpot[] {
    try {
      const raw = localStorage.getItem(SPOT_STORAGE_KEY);
      if (!raw) {
        this.saveSpots(INITIAL_SKI_SPOTS);
        return [...INITIAL_SKI_SPOTS];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveSpots(INITIAL_SKI_SPOTS);
        return [...INITIAL_SKI_SPOTS];
      }

      const isValidCoord = (val: any, min: number, max: number): boolean => {
        return (
          val !== null &&
          val !== undefined &&
          typeof val === 'number' &&
          !isNaN(val) &&
          Number.isFinite(val) &&
          val >= min &&
          val <= max
        );
      };

      const validSpots: SkiSpot[] = parsed
        .filter(
          (s: any) =>
            s &&
            typeof s.id === 'string' &&
            s.id.trim().length > 0 &&
            typeof s.name === 'string' &&
            s.name.trim().length > 0 &&
            isValidCoord(s.lat, -90, 90) &&
            isValidCoord(s.lon, -180, 180)
        )
        .map((s: any, idx: number) => ({
          id: String(s.id).trim(),
          name: String(s.name).trim(),
          lat: Number(s.lat),
          lon: Number(s.lon),
          pref: s.pref ? String(s.pref).trim() : '',
          order: typeof s.order === 'number' && Number.isFinite(s.order) ? s.order : idx
        }));

      if (validSpots.length === 0) {
        this.saveSpots(INITIAL_SKI_SPOTS);
        return [...INITIAL_SKI_SPOTS];
      }

      return validSpots.sort((a, b) => a.order - b.order);
    } catch {
      this.saveSpots(INITIAL_SKI_SPOTS);
      return [...INITIAL_SKI_SPOTS];
    }
  }

  static saveSpots(spots: SkiSpot[]): void {
    const ordered = spots.map((s, index) => ({ ...s, order: index }));
    try {
      localStorage.setItem(SPOT_STORAGE_KEY, JSON.stringify(ordered));
    } catch (e) {
      console.warn('Failed to persist spots to localStorage', e);
    }
  }

  static addSpot(form: SpotFormData): { spot?: SkiSpot; validation: ValidationResult } {
    const currentSpots = this.getSpots();
    const validation = validateSpotInput(form.name, form.lat, form.lon, currentSpots);
    if (!validation.isValid || !validation.sanitized) {
      return { validation };
    }

    const newSpot: SkiSpot = {
      id: `spot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: validation.sanitized.name,
      lat: validation.sanitized.lat,
      lon: validation.sanitized.lon,
      order: currentSpots.length
    };

    currentSpots.push(newSpot);
    this.saveSpots(currentSpots);
    return { spot: newSpot, validation };
  }

  static updateSpot(id: string, form: SpotFormData): { spot?: SkiSpot; validation: ValidationResult } {
    const currentSpots = this.getSpots();
    const index = currentSpots.findIndex((s) => s.id === id);
    if (index === -1) {
      return { validation: { isValid: false, errors: { general: '対象スポットが見つかりません' } } };
    }

    const validation = validateSpotInput(form.name, form.lat, form.lon, currentSpots, id);
    if (!validation.isValid || !validation.sanitized) {
      return { validation };
    }

    currentSpots[index] = {
      ...currentSpots[index],
      name: validation.sanitized.name,
      lat: validation.sanitized.lat,
      lon: validation.sanitized.lon
    };

    this.saveSpots(currentSpots);
    return { spot: currentSpots[index], validation };
  }

  static deleteSpot(id: string): { success: boolean; error?: string } {
    const currentSpots = this.getSpots();
    if (currentSpots.length <= 1) {
      return { success: false, error: '最低1件のスポットが必要です（全件削除はできません）' };
    }

    const filtered = currentSpots.filter((s) => s.id !== id);
    if (filtered.length === currentSpots.length) {
      return { success: false, error: '対象スポットが見つかりません' };
    }

    this.saveSpots(filtered);

    // If active spot was deleted, fall back to first spot
    if (this.getActiveSpotId() === id) {
      this.setActiveSpotId(filtered[0].id);
    }

    return { success: true };
  }

  static moveSpot(index: number, direction: 'up' | 'down'): SkiSpot[] {
    const spots = this.getSpots();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= spots.length) {
      return spots;
    }

    const temp = spots[index];
    spots[index] = spots[targetIndex];
    spots[targetIndex] = temp;

    this.saveSpots(spots);
    return spots;
  }

  static resetToPresets(): SkiSpot[] {
    this.saveSpots(INITIAL_SKI_SPOTS);
    this.setActiveSpotId(INITIAL_SKI_SPOTS[0].id);
    return [...INITIAL_SKI_SPOTS];
  }

  static getActiveSpotId(): string {
    const spots = this.getSpots();
    try {
      const saved = localStorage.getItem(ACTIVE_SPOT_ID_KEY);
      if (saved && spots.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {
      // pass
    }
    const defaultId = spots[0]?.id || INITIAL_SKI_SPOTS[0].id;
    this.setActiveSpotId(defaultId);
    return defaultId;
  }

  static setActiveSpotId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_SPOT_ID_KEY, id);
    } catch {
      // pass
    }
  }

  static cycleNextSpot(): { spot: SkiSpot; index: number } {
    const spots = this.getSpots();
    if (spots.length === 0) {
      return { spot: INITIAL_SKI_SPOTS[0], index: 0 };
    }
    const currentId = this.getActiveSpotId();
    const currentIndex = spots.findIndex((s) => s.id === currentId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % spots.length : 0;
    const nextSpot = spots[nextIndex];
    this.setActiveSpotId(nextSpot.id);
    return { spot: nextSpot, index: nextIndex };
  }
}
