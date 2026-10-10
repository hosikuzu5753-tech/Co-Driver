// frontend/src/components/lyrics/LyricLineItem.tsx

import React, { memo } from 'react';
import { LyricLine } from '../../types/lyrics';

interface LyricLineItemProps {
  line: LyricLine;
  index: number;
  isActive: boolean;
  isPast: boolean;
  onSeek?: (timeMs: number) => void;
  refCallback: (el: HTMLDivElement | null) => void;
}

export const LyricLineItem: React.FC<LyricLineItemProps> = memo(
  ({ line, isActive, isPast, onSeek, refCallback }) => {
    const handleClick = () => {
      if (onSeek) {
        onSeek(line.timeMs);
      }
    };

    const statusClass = isActive ? 'active' : isPast ? 'past' : 'future';

    return (
      <div
        ref={refCallback}
        className={`lyric-line ${statusClass}`}
        data-testid="lyric-line"
        data-active={isActive ? 'true' : 'false'}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {line.text}
      </div>
    );
  }
);

LyricLineItem.displayName = 'LyricLineItem';
