// src/components/header/HeaderBar.tsx

import React from 'react';
import { DigitalClock } from './DigitalClock';
import { ConnectionIndicator } from './ConnectionIndicator';
import { WeatherWidget } from './WeatherWidget';
import { QuickActions } from './QuickActions';
import { ConnectionStatus } from '../../types/connection';
import { SkiSpot } from '../../types/spot';
import { WeatherData } from '../../types/weather';

export interface HeaderBarProps {
  connectionStatus: ConnectionStatus;
  wsHost?: string;
  wsLatency?: number;
  onConnectionClick?: () => void;

  currentLocationWeather: WeatherData | null;
  isLoadingCurrentWeather: boolean;
  onRefreshCurrentLocation: () => void;

  selectedSpot: SkiSpot | null;
  spotWeather: WeatherData | null;
  isLoadingSpotWeather: boolean;
  onNextSpot: () => void;
  onOpenSpotManager: () => void;

  isMaximized: boolean;
  onToggleMaximize: () => void;
  onOpenCalculator: () => void;
  isDemoMode: boolean;
  onToggleDemo: () => void;
  isWakeLocked: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  connectionStatus,
  wsHost,
  wsLatency,
  onConnectionClick,

  currentLocationWeather,
  isLoadingCurrentWeather,
  onRefreshCurrentLocation,

  selectedSpot,
  spotWeather,
  isLoadingSpotWeather,
  onNextSpot,
  onOpenSpotManager,

  isMaximized,
  onToggleMaximize,
  onOpenCalculator,
  isDemoMode,
  onToggleDemo,
  isWakeLocked,
}) => {
  return (
    <header className="header-bar" data-testid="header-bar">
      {/* Left: Clock and Connection LED */}
      <div className="header-left">
        <DigitalClock />
        <ConnectionIndicator
          status={connectionStatus}
          host={wsHost}
          latencyMs={wsLatency}
          onClick={onConnectionClick}
        />
      </div>

      {/* Center: Weather Widget (Location + Spot) */}
      <div className="header-center">
        <WeatherWidget
          currentLocationWeather={currentLocationWeather}
          isLoadingCurrentWeather={isLoadingCurrentWeather}
          onRefreshCurrentLocation={onRefreshCurrentLocation}
          selectedSpot={selectedSpot}
          spotWeather={spotWeather}
          isLoadingSpotWeather={isLoadingSpotWeather}
          onNextSpot={onNextSpot}
          onOpenSpotManager={onOpenSpotManager}
        />
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="header-right">
        <QuickActions
          isMaximized={isMaximized}
          onToggleMaximize={onToggleMaximize}
          onOpenCalculator={onOpenCalculator}
          isDemoMode={isDemoMode}
          onToggleDemo={onToggleDemo}
          isWakeLocked={isWakeLocked}
        />
      </div>
    </header>
  );
};
