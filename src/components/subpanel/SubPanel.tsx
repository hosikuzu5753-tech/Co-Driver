// frontend/src/components/subpanel/SubPanel.tsx

import React from 'react';
import { SpotifyPlayer } from './SpotifyPlayer';
import { NotificationStack } from './NotificationStack';
import { MediaStatePayload, NotificationPayload } from '../../types/protocol';

export interface SubPanelProps {
  mediaState?: MediaStatePayload;
  currentMs?: number;
  notifications?: NotificationPayload[];
  onPlayPauseToggle?: () => void;
  onSeek?: (positionMs: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onClearNotifications?: () => void;
  className?: string;
}

export const SubPanel: React.FC<SubPanelProps> = ({
  mediaState,
  currentMs = 0,
  notifications = [],
  onPlayPauseToggle,
  onSeek,
  onPrevious,
  onNext,
  onClearNotifications,
  className = '',
}) => {
  return (
    <div className={`sub-panel-content ${className}`} data-testid="sub-panel-content">
      {/* Spotify Player Controller */}
      <section className="subpanel-player-section">
        <SpotifyPlayer
          trackTitle={mediaState?.track}
          artist={mediaState?.artist}
          album={mediaState?.album}
          albumArtUrl={mediaState?.albumArtUrl}
          positionMs={currentMs}
          durationMs={mediaState?.durationMs}
          isPlaying={mediaState?.isPlaying}
          onPlayPauseToggle={onPlayPauseToggle}
          onSeek={onSeek}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </section>

      {/* LINE Notification History Stack */}
      <section className="subpanel-notif-section">
        <NotificationStack
          notifications={notifications}
          onClearAll={onClearNotifications}
        />
      </section>
    </div>
  );
};
