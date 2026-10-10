// frontend/src/components/lyrics/LyricsPanel.tsx

import React, { useMemo } from 'react';
import { parseLrc } from '../../utils/lrcParser';
import { useLyricsSync } from '../../hooks/useLyricsSync';
import { LyricsView } from './LyricsView';
import { MaximizeToggle } from './MaximizeToggle';
import { LyricsStatus } from '../../types/lyrics';
import { Music } from 'lucide-react';

interface LyricsPanelProps {
  trackTitle?: string;
  artist?: string;
  lrcContent?: string;
  currentMs: number;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onSeek?: (timeMs: number) => void;
  status?: LyricsStatus;
  plainLyrics?: string;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  trackTitle = '曲名なし',
  artist = 'アーティスト不明',
  lrcContent = '',
  currentMs,
  isMaximized,
  onToggleMaximize,
  onSeek,
  status = 'synced',
  plainLyrics,
}) => {
  // Parse LRC lyrics
  const parsed = useMemo(() => parseLrc(lrcContent), [lrcContent]);

  // Sync active index & smooth center auto-scroll with 4s manual interaction pause
  const {
    activeIndex,
    isUserInteracting,
    resumeSync,
    containerRef,
    lineRefs,
  } = useLyricsSync({
    lines: parsed.lines,
    currentMs,
  });

  return (
    <div
      className={`lyrics-panel-container ${isMaximized ? 'maximized' : ''}`}
      data-testid="lyrics-panel"
    >
      {/* Panel Header */}
      <header className="lyrics-panel-header">
        <div className="lyrics-track-info">
          <div className="lyrics-track-title" title={trackTitle}>
            <Music size={18} className="lyrics-music-icon" />
            <span>{trackTitle}</span>
          </div>
          <div className="lyrics-track-artist">{artist}</div>
        </div>

        <MaximizeToggle
          isMaximized={isMaximized}
          onToggle={onToggleMaximize}
        />
      </header>

      {/* Main Lyrics View */}
      <div className="lyrics-content-area">
        <LyricsView
          lines={parsed.lines}
          activeIndex={activeIndex}
          isUserInteracting={isUserInteracting}
          onResumeSync={resumeSync}
          onSeek={onSeek}
          containerRef={containerRef}
          lineRefs={lineRefs}
          status={status}
          plainLyrics={plainLyrics}
        />
      </div>
    </div>
  );
};
