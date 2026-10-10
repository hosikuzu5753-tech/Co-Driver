// src/components/header/WeatherWidget.tsx

import React from 'react';
import { WeatherData } from '../../types/weather';
import { SkiSpot } from '../../types/spot';
import { WeatherIcon } from './WeatherIcon';
import { SpotSwitcher } from './SpotSwitcher';

export interface WeatherWidgetProps {
  currentLocationWeather: WeatherData | null;
  isLoadingCurrentWeather: boolean;
  onRefreshCurrentLocation: () => void;
  selectedSpot: SkiSpot | null;
  spotWeather: WeatherData | null;
  isLoadingSpotWeather: boolean;
  onNextSpot: () => void;
  onOpenSpotManager: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  currentLocationWeather,
  isLoadingCurrentWeather,
  onRefreshCurrentLocation,
  selectedSpot,
  spotWeather,
  isLoadingSpotWeather,
  onNextSpot,
  onOpenSpotManager,
}) => {
  return (
    <div className="weather-widget" data-testid="weather-widget">
      {/* 1. Current Location Weather Badge */}
      <div
        className="weather-badge clickable"
        onClick={onRefreshCurrentLocation}
        title="現在地の天気を更新"
        data-testid="current-weather-badge"
      >
        <span className="weather-loc-label">📍 現在地</span>
        {isLoadingCurrentWeather ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--cd-text-muted)' }}>測位中...</span>
        ) : currentLocationWeather ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <WeatherIcon type={currentLocationWeather.condition.icon} size={18} />
            <span className="weather-temp font-mono">
              {currentLocationWeather.temperature > 0
                ? `+${currentLocationWeather.temperature}`
                : currentLocationWeather.temperature}°C
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--cd-status-reconnecting)' }}>取得待機</span>
        )}
      </div>

      {/* 2. Selected Ski Spot Weather & Cyclic Switcher */}
      <SpotSwitcher
        currentSpot={selectedSpot}
        spotWeather={spotWeather}
        isLoadingWeather={isLoadingSpotWeather}
        onNextSpot={onNextSpot}
        onOpenManager={onOpenSpotManager}
      />
    </div>
  );
};
