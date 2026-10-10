// src/utils/validation.ts

import { SkiSpot } from '../types/spot';

export interface ValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    lat?: string;
    lon?: string;
    general?: string;
  };
  sanitized?: {
    name: string;
    lat: number;
    lon: number;
  };
}

/**
 * 座標文字列のサニタイズ処理:
 * - 前後空白の除去
 * - 全角数字 (０-９: U+FF10-U+FF19) を半角 (0-9) に変換
 * - 全角ピリオド (．: U+FF0E) および句点 (。: U+3002) を半角ピリオド '.' に変換
 * - 各種全角マイナス・長音・ダッシュ記号を半角マイナス '-' (U+002D) に変換
 */
export function sanitizeCoordinateString(raw: string | number): string {
  return String(raw ?? '')
    .trim()
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, '.')
    .replace(/[－−ー‐―–—]/g, '-');
}

export function validateSpotInput(
  rawName: string,
  rawLat: string | number,
  rawLon: string | number,
  existingSpots: SkiSpot[],
  currentEditId?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Sanitize (trim, convert full-width numbers, periods, and minuses to half-width)
  const name = (rawName || '').trim();
  const latStr = sanitizeCoordinateString(rawLat);
  const lonStr = sanitizeCoordinateString(rawLon);

  // 2. Name validation
  if (!name) {
    errors.name = 'スポット名称を入力してください';
  } else if (name.length > 50) {
    errors.name = 'スポット名称は50文字以内で入力してください';
  }

  // 3. Latitude validation
  const lat = Number(latStr);
  if (latStr === '' || isNaN(lat)) {
    errors.lat = '有効な数値を入力してください';
  } else if (lat < -90 || lat > 90) {
    errors.lat = '緯度は -90 〜 90 の範囲で入力してください';
  }

  // 4. Longitude validation
  const lon = Number(lonStr);
  if (lonStr === '' || isNaN(lon)) {
    errors.lon = '有効な数値を入力してください';
  } else if (lon < -180 || lon > 180) {
    errors.lon = '経度は -180 〜 180 の範囲で入力してください';
  }

  // 5. Duplicate check
  if (!errors.name && !errors.lat && !errors.lon) {
    const isDuplicate = existingSpots.some((spot) => {
      if (currentEditId && spot.id === currentEditId) return false;
      const isSameCoords = Math.abs(spot.lat - lat) < 0.0001 && Math.abs(spot.lon - lon) < 0.0001;
      const isSameName = spot.name.toLowerCase() === name.toLowerCase();
      return isSameCoords || isSameName;
    });

    if (isDuplicate) {
      errors.general = '同名または同一座標のスポットが既に登録されています';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    sanitized: isValid ? { name, lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)) } : undefined
  };
}
