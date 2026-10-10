// src/components/header/SpotSwitcher.tsx

import React from 'react';
import { Settings } from 'lucide-react';
import { SkiSpot } from '../../types/spot';
import { WeatherData } from '../../types/weather';
import { WeatherIcon } from './WeatherIcon';

export interface SpotSwitcherProps {
  currentSpot: SkiSpot | null;
  spotWeather: WeatherData | null;
  isLoadingWeather: boolean;
  onNextSpot: () => void;
  onOpenManager: () => void;
}

export const SpotSwitcher: React.FC<SpotSwitcherProps> = ({
  currentSpot,
  spotWeather,
  isLoadingWeather,
  onNextSpot,
  onOpenManager,
}) => {
  return (
    <div className="spot-switcher-badge" data-testid="spot-switcher">
      <button
        onClick={onNextSpot}
        className="spot-switcher-btn"
        title="タップで次のスポットへ切り替え"
        data-testid="btn-spot-cycle"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🏔️</span>
          <span>{currentSpot ? currentSpot.name : '未選択'}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--cd-amber-primary)' }}>⇄</span>
        </span>

        {isLoadingWeather ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--cd-text-muted)' }}>取得中...</span>
        ) : spotWeather ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <WeatherIcon type={spotWeather.condition.icon} size={18} />
            <span className={`weather-temp ${spotWeather.condition.isSnow ? 'snow' : ''}`}>
              {spotWeather.temperature > 0 ? `+${spotWeather.temperature}` : spotWeather.temperature}°C
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--cd-text-muted)' }}>
              ({spotWeather.condition.label})
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--cd-text-muted)' }}>--.-°C</span>
        )}
      </button>

      <button
        onClick={onOpenManager}
        className="spot-settings-trigger"
        title="スポット管理を開く"
        aria-label="スポット管理"
        data-testid="btn-spot-manager"
      >
        <Settings size={18} />
      </button>
    </div>
  );
};
