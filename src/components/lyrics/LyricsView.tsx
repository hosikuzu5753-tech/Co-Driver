// frontend/src/components/lyrics/LyricsView.tsx

import React from 'react';
import { LyricLine, LyricsStatus } from '../../types/lyrics';
import { LyricLineItem } from './LyricLineItem';
import { ArrowDownCircle, Loader2 } from 'lucide-react';

interface LyricsViewProps {
  lines: LyricLine[];
  activeIndex: number;
  isUserInteracting: boolean;
  onResumeSync: () => void;
  onSeek?: (timeMs: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  lineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  status?: LyricsStatus;
  plainLyrics?: string;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lines,
  activeIndex,
  isUserInteracting,
  onResumeSync,
  onSeek,
  containerRef,
  lineRefs,
  status = 'synced',
  plainLyrics,
}) => {
  // 1. Loading state
  if (status === 'loading') {
    return (
      <div className="lyrics-status-container" data-testid="lyrics-loading-state">
        <Loader2 className="lyrics-spinner" size={32} />
        <p className="status-text">歌詞を取得しています...</p>
        <div className="lyrics-skeleton-container" aria-hidden="true">
          <div className="lyrics-skeleton-line short" />
          <div className="lyrics-skeleton-line long" />
          <div className="lyrics-skeleton-line medium" />
          <div className="lyrics-skeleton-line long" />
        </div>
      </div>
    );
  }

  // 2. Error state
  if (status === 'error') {
    return (
      <div className="lyrics-empty-state" data-testid="lyrics-error-state">
        <p className="empty-text error">歌詞の取得に失敗しました</p>
        <p className="empty-subtext">ネットワーク接続を確認するか、次の曲をお試しください</p>
      </div>
    );
  }

  // 3. Not found state
  if (status === 'not_found') {
    return (
      <div className="lyrics-empty-state" data-testid="lyrics-not-found-state">
        <p className="empty-text">歌詞が見つかりませんでした</p>
        <p className="empty-subtext">この楽曲の歌詞データはまだ登録されていません</p>
      </div>
    );
  }

  // 4. Plain lyrics (non-synced fallback)
  if (status === 'plain' && plainLyrics) {
    const plainLines = plainLyrics.split('\n');
    return (
      <div className="lyrics-plain-container" data-testid="lyrics-plain-container">
        <div className="lyrics-plain-badge">※非同期歌詞（手動スクロール）</div>
        <div className="lyrics-plain-content">
          {plainLines.map((line, idx) => (
            <p key={`plain-${idx}`} className="lyrics-plain-line">
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // 5. Empty synced lines
  if (!lines || lines.length === 0) {
    return (
      <div className="lyrics-empty-state" data-testid="lyrics-empty-state">
        <p className="empty-text">同期歌詞が読み込まれていません</p>
      </div>
    );
  }

  return (
    <div className="lyrics-view-wrapper" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div
        ref={containerRef}
        className="lyrics-scroll-container"
        data-testid="lyrics-scroll-container"
      >
        {/* Top 45vh spacer for center auto-scrolling the first line */}
        <div className="lyrics-spacer" aria-hidden="true" />

        {/* Lyric lines list */}
        {lines.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPast = activeIndex !== -1 && idx < activeIndex;

          return (
            <LyricLineItem
              key={line.id || `line-${idx}-${line.timeMs}`}
              line={line}
              index={idx}
              isActive={isActive}
              isPast={isPast}
              onSeek={onSeek}
              refCallback={(el) => {
                lineRefs.current[idx] = el;
              }}
            />
          );
        })}

        {/* Bottom 45vh spacer for center auto-scrolling the last line */}
        <div className="lyrics-spacer" aria-hidden="true" />
      </div>

      {/* Floating Resume Auto-Scroll Button */}
      {isUserInteracting && (
        <button
          type="button"
          className="lyrics-resume-badge"
          data-testid="lyrics-resume-badge"
          onClick={onResumeSync}
        >
          <ArrowDownCircle size={18} />
          <span>同期再開（中央に戻る）</span>
        </button>
      )}
    </div>
  );
};
