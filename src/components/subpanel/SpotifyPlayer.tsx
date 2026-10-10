// frontend/src/components/subpanel/SpotifyPlayer.tsx

import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { FallbackAlbumArt } from './FallbackAlbumArt';
import { MarqueeText } from './MarqueeText';
import { formatTimeMs } from '../../utils/formatTime';
import { triggerHaptic } from '../../utils/audioFeedback';

export interface SpotifyPlayerProps {
  trackTitle?: string;
  artist?: string;
  album?: string;
  albumArtUrl?: string;
  positionMs?: number;
  durationMs?: number;
  isPlaying?: boolean;
  onPlayPauseToggle?: () => void;
  onSeek?: (positionMs: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  trackTitle = '曲名なし',
  artist = 'アーティスト不明',
  album = '',
  albumArtUrl = '',
  positionMs = 0,
  durationMs = 180000,
  isPlaying = false,
  onPlayPauseToggle,
  onSeek,
  onPrevious,
  onNext,
  className = '',
}) => {
  const [imgError, setImgError] = useState<boolean>(false);

  // Calculate seek ratio (0..1)
  const safeDuration = durationMs > 0 ? durationMs : 1;
  const progressRatio = Math.max(0, Math.min(1, positionMs / safeDuration));
  const progressPercent = (progressRatio * 100).toFixed(2);

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetMs = Math.round(ratio * durationMs);
    triggerHaptic(10);
    onSeek(targetMs);
  };

  const handlePlayPause = () => {
    triggerHaptic(15);
    onPlayPauseToggle?.();
  };

  const handlePrev = () => {
    triggerHaptic(10);
    onPrevious?.();
  };

  const handleNxt = () => {
    triggerHaptic(10);
    onNext?.();
  };

  return (
    <div
      className={`spotify-player-card ${className}`}
      data-testid="spotify-player"
    >
      {/* Top Section: Album Art & Track Meta */}
      <div className="player-track-header">
        <div className="album-art-wrapper">
          {albumArtUrl && !imgError ? (
            <img
              src={albumArtUrl}
              alt={trackTitle}
              className="album-art-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <FallbackAlbumArt size={96} isPlaying={isPlaying} />
          )}
        </div>

        <div className="track-meta">
          <div className="track-title-wrapper">
            <MarqueeText text={trackTitle} className="player-title" />
          </div>
          <div className="player-artist" title={artist}>
            {artist}
          </div>
          {album && (
            <div className="player-album" title={album}>
              {album}
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Seek Bar */}
      <div className="player-seek-section">
        <div
          className="seek-bar-hitbox"
          onClick={handleSeekClick}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={durationMs}
          aria-valuenow={positionMs}
          aria-label="再生位置シークバー"
          data-testid="seek-bar"
        >
          <div className="seek-bar-track">
            <div
              className="seek-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="seek-bar-thumb"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="seek-time-row">
          <span className="time-elapsed" data-testid="time-elapsed">
            {formatTimeMs(positionMs)}
          </span>
          <span className="time-duration" data-testid="time-duration">
            {formatTimeMs(durationMs)}
          </span>
        </div>
      </div>

      {/* Bottom Section: Large Touch Controls (>= 52px) */}
      <div className="player-controls-row">
        <button
          type="button"
          className="player-btn btn-prev"
          data-testid="player-prev-btn"
          onClick={handlePrev}
          title="前の曲"
          aria-label="前の曲"
        >
          <SkipBack size={26} />
        </button>

        <button
          type="button"
          className={`player-btn btn-play-pause ${isPlaying ? 'playing' : 'paused'}`}
          data-testid="player-play-pause-btn"
          onClick={handlePlayPause}
          title={isPlaying ? '一時停止' : '再生'}
          aria-label={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} className="play-icon-offset" />}
        </button>

        <button
          type="button"
          className="player-btn btn-next"
          data-testid="player-next-btn"
          onClick={handleNxt}
          title="次の曲"
          aria-label="次の曲"
        >
          <SkipForward size={26} />
        </button>
      </div>
    </div>
  );
};
