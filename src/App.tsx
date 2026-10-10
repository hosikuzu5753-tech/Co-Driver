// src/App.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CockpitShell } from './components/layout/CockpitShell';
import { HeaderBar } from './components/header/HeaderBar';
import { SpotManagerModal } from './components/modals/SpotManagerModal';
import { CalculatorModal } from './components/modals/CalculatorModal';
import { LyricsPanel } from './components/lyrics/LyricsPanel';
import { SubPanel } from './components/subpanel/SubPanel';
import { NotificationToast } from './components/subpanel/NotificationToast';
import { DemoSimulatorControl } from './components/simulator/DemoSimulatorControl';

import { useWakeLock } from './hooks/useWakeLock';
import { useNotifications } from './hooks/useNotifications';
import { usePlaybackInterpolation } from './hooks/usePlaybackInterpolation';
import { SpotStorageService } from './services/spotStorageService';
import { WeatherService } from './services/weatherService';
import { WebSocketService } from './services/websocketService';
import { LyricsService } from './services/lyricsService';
import { MockDataService, MOCK_LRC_CONTENT } from './services/mockDataService';
import { QrParser } from './utils/qrParser';
import { SkiSpot } from './types/spot';
import { WeatherData } from './types/weather';
import { ConnectionStatus } from './types/connection';
import { MediaStatePayload } from './types/protocol';
import { LyricsStatus } from './types/lyrics';

export const App: React.FC = () => {
  // Screen Wake Lock API
  const { isLocked: isWakeLocked } = useWakeLock();

  // Layout & Mode States
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [wsHost, setWsHost] = useState<string>('192.168.43.1:8080');
  const [wsLatency, setWsLatency] = useState<number | undefined>(undefined);

  // Modals States
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [isSpotModalOpen, setIsSpotModalOpen] = useState<boolean>(false);

  // Spot Management States
  const [spots, setSpots] = useState<SkiSpot[]>(() => SpotStorageService.getSpots());
  const [activeSpotId, setActiveSpotId] = useState<string>(() => SpotStorageService.getActiveSpotId());

  // Weather States
  const [currentLocationWeather, setCurrentLocationWeather] = useState<WeatherData | null>(null);
  const [isLoadingCurrentWeather, setIsLoadingCurrentWeather] = useState<boolean>(true);

  const [spotWeather, setSpotWeather] = useState<WeatherData | null>(null);
  const [isLoadingSpotWeather, setIsLoadingSpotWeather] = useState<boolean>(true);

  const spotAbortRef = useRef<AbortController | null>(null);

  const selectedSpot = spots.find((s) => s.id === activeSpotId) || spots[0] || null;

  // Media & Lyrics States
  const [mediaState, setMediaState] = useState<MediaStatePayload>(() =>
    MockDataService.getCurrentMediaState()
  );
  const [lrcContent, setLrcContent] = useState<string>(MOCK_LRC_CONTENT);
  const [plainLyrics, setPlainLyrics] = useState<string | undefined>(undefined);
  const [lyricsStatus, setLyricsStatus] = useState<LyricsStatus>('synced');
  const lyricsAbortRef = useRef<AbortController | null>(null);

  // Dead-Reckoning Position Interpolation
  const currentMs = usePlaybackInterpolation(mediaState);

  // LINE Notification System (Stack & Toast)
  const {
    notifications,
    activeToast,
    pushNotification,
    dismissToast,
    clearHistory,
  } = useNotifications();

  // 1. Fetch Current Location Weather via Geolocation & Open-Meteo
  const loadCurrentLocationWeather = useCallback(async () => {
    setIsLoadingCurrentWeather(true);
    try {
      const coords = await WeatherService.getCurrentPosition();
      const data = await WeatherService.fetchWeather(coords.lat, coords.lon);
      setCurrentLocationWeather(data);
    } catch {
      // Fallback with realistic weather
      const fallback = WeatherService.getMockWeather(35.6812, 139.7671);
      setCurrentLocationWeather(fallback);
    } finally {
      setIsLoadingCurrentWeather(false);
    }
  }, []);

  // 2. Fetch Selected Ski Resort Spot Weather
  const loadSpotWeather = useCallback(async (spot: SkiSpot) => {
    if (spotAbortRef.current) {
      spotAbortRef.current.abort();
    }
    const controller = new AbortController();
    spotAbortRef.current = controller;

    setIsLoadingSpotWeather(true);
    try {
      const data = await WeatherService.fetchWeather(spot.lat, spot.lon, controller.signal);
      setSpotWeather(data);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        const fallback = WeatherService.getMockWeather(spot.lat, spot.lon);
        setSpotWeather(fallback);
      }
    } finally {
      setIsLoadingSpotWeather(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCurrentLocationWeather();
  }, [loadCurrentLocationWeather]);

  useEffect(() => {
    if (selectedSpot) {
      loadSpotWeather(selectedSpot);
    }
  }, [selectedSpot, loadSpotWeather]);

  // Periodic weather refresh (every 10 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      loadCurrentLocationWeather();
      if (selectedSpot) {
        loadSpotWeather(selectedSpot);
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadCurrentLocationWeather, loadSpotWeather, selectedSpot]);

  // Dynamic Lyrics Fetch on Track / Artist Change
  useEffect(() => {
    // In demo mode, prioritize mock lyrics for predictable simulation
    if (isDemoMode) {
      setLrcContent(MOCK_LRC_CONTENT);
      setPlainLyrics(undefined);
      setLyricsStatus('synced');
      return;
    }

    const track = mediaState.track?.trim();
    const artist = mediaState.artist?.trim();

    if (!track || track === '曲名なし') {
      setLrcContent('');
      setPlainLyrics(undefined);
      setLyricsStatus('idle');
      return;
    }

    // Cancel in-flight lyrics request
    if (lyricsAbortRef.current) {
      lyricsAbortRef.current.abort();
    }
    const controller = new AbortController();
    lyricsAbortRef.current = controller;

    setLyricsStatus('loading');

    LyricsService.fetchLyrics(
      track,
      artist,
      mediaState.album,
      mediaState.durationMs,
      controller.signal
    )
      .then((res) => {
        setLyricsStatus(res.status);
        if (res.status === 'synced') {
          setLrcContent(res.syncedLyrics || '');
          setPlainLyrics(undefined);
        } else if (res.status === 'plain') {
          setLrcContent('');
          setPlainLyrics(res.plainLyrics);
        } else {
          setLrcContent('');
          setPlainLyrics(undefined);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setLyricsStatus('error');
          setLrcContent('');
          setPlainLyrics(undefined);
        }
      });

    return () => {
      controller.abort();
    };
  }, [mediaState.track, mediaState.artist, mediaState.album, mediaState.durationMs, isDemoMode]);

  // WebSocket Connection & Event Lifecycle
  useEffect(() => {
    const ws = WebSocketService.getInstance();
    const target = QrParser.resolveConnectionTarget();
    setWsHost(`${target.host}:${target.port}`);

    // Subscribe to connection state
    const unsubConn = ws.onConnectionState((state) => {
      setConnectionStatus(state.status);
      setWsHost(`${state.host}:${state.port}`);
      setWsLatency(state.latencyMs);
    });

    // Subscribe to Media State updates
    const unsubMedia = ws.onMediaState((media) => {
      setMediaState(media);
    });

    // Subscribe to incoming NOTIFICATION events
    const unsubNotif = ws.onNotification((notif) => {
      pushNotification(notif);
    });

    // Connect if not in standalone demo mode
    if (!isDemoMode) {
      ws.connect(target.host, target.port);
    }

    return () => {
      unsubConn();
      unsubMedia();
      unsubNotif();
      ws.disconnect();
    };
  }, [isDemoMode, pushNotification]);

  // Spot Cyclic Switch Handler (One-tap sequential)
  const handleNextSpot = useCallback(() => {
    const { spot } = SpotStorageService.cycleNextSpot();
    setActiveSpotId(spot.id);
  }, []);

  // Spot Modal Update Callback
  const handleSpotsUpdated = useCallback((newSpots: SkiSpot[], newActiveId: string) => {
    setSpots(newSpots);
    setActiveSpotId(newActiveId);
  }, []);

  // Toggle Demo Mode
  const handleToggleDemo = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      const ws = WebSocketService.getInstance();
      ws.setDemoMode(next);

      if (next) {
        // Start playback simulation timer in demo mode
        MockDataService.startPlaybackSimulation((m) => {
          ws.dispatchMockMediaState(m);
        });
      } else {
        MockDataService.stopPlaybackSimulation();
      }

      return next;
    });
  }, []);

  // Media Controls Handlers
  const handlePlayPauseToggle = useCallback(() => {
    const ws = WebSocketService.getInstance();
    if (isDemoMode) {
      MockDataService.togglePlayPause();
      ws.dispatchMockMediaState(MockDataService.getCurrentMediaState());
    } else {
      ws.sendPlayPause('toggle');
    }
  }, [isDemoMode]);

  const handleSeek = useCallback(
    (positionMs: number) => {
      const ws = WebSocketService.getInstance();
      if (isDemoMode) {
        MockDataService.seek(positionMs);
        ws.dispatchMockMediaState(MockDataService.getCurrentMediaState());
      } else {
        ws.sendSeek(positionMs);
      }
    },
    [isDemoMode]
  );

  const handlePreviousTrack = useCallback(() => {
    handleSeek(0);
  }, [handleSeek]);

  const handleNextTrack = useCallback(() => {
    handleSeek(0);
  }, [handleSeek]);

  // Demo Simulator Controls Handlers
  const handleSeekOffset = useCallback(
    (offsetSec: number) => {
      const target = currentMs + offsetSec * 1000;
      handleSeek(target);
    },
    [currentMs, handleSeek]
  );

  const handleInjectNotification = useCallback(() => {
    const ws = WebSocketService.getInstance();
    const notif = MockDataService.generateNextNotification();
    ws.dispatchMockNotification(notif);
  }, []);

  const handleConnectClick = useCallback(() => {
    const ws = WebSocketService.getInstance();
    if (connectionStatus !== 'connected' && connectionStatus !== 'demo') {
      ws.connect();
    }
  }, [connectionStatus]);

  return (
    <>
      <CockpitShell
        header={
          <HeaderBar
            connectionStatus={isDemoMode ? 'demo' : connectionStatus}
            wsHost={wsHost}
            wsLatency={wsLatency}
            onConnectionClick={handleConnectClick}
            currentLocationWeather={currentLocationWeather}
            isLoadingCurrentWeather={isLoadingCurrentWeather}
            onRefreshCurrentLocation={loadCurrentLocationWeather}
            selectedSpot={selectedSpot}
            spotWeather={spotWeather}
            isLoadingSpotWeather={isLoadingSpotWeather}
            onNextSpot={handleNextSpot}
            onOpenSpotManager={() => setIsSpotModalOpen(true)}
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized((prev) => !prev)}
            onOpenCalculator={() => setIsCalcOpen(true)}
            isDemoMode={isDemoMode}
            onToggleDemo={handleToggleDemo}
            isWakeLocked={isWakeLocked}
          />
        }
        mainPanel={
          <LyricsPanel
            trackTitle={mediaState.track}
            artist={mediaState.artist}
            lrcContent={lrcContent}
            currentMs={currentMs}
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized((prev) => !prev)}
            onSeek={handleSeek}
            status={lyricsStatus}
            plainLyrics={plainLyrics}
          />
        }
        subPanel={
          <SubPanel
            mediaState={mediaState}
            currentMs={currentMs}
            notifications={notifications}
            onPlayPauseToggle={handlePlayPauseToggle}
            onSeek={handleSeek}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
            onClearNotifications={clearHistory}
          />
        }
        isMaximized={isMaximized}
      />

      {/* Top Animated LINE Notification Toast Overlay */}
      <NotificationToast
        notification={activeToast}
        onDismiss={dismissToast}
      />

      {/* Standalone Simulator Floating Control Bar */}
      <DemoSimulatorControl
        isDemoMode={isDemoMode}
        isPlaying={mediaState.isPlaying}
        onTogglePlayPause={handlePlayPauseToggle}
        onSeekOffset={handleSeekOffset}
        onInjectNotification={handleInjectNotification}
      />

      {/* Spot Manager Modal (CRUD) */}
      <SpotManagerModal
        isOpen={isSpotModalOpen}
        onClose={() => setIsSpotModalOpen(false)}
        onSpotsUpdated={handleSpotsUpdated}
      />

      {/* Large Touch Calculator Modal */}
      <CalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />
    </>
  );
};

export default App;
