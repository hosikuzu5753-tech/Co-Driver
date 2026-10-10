// frontend/src/components/lyrics/MaximizeToggle.tsx

import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MaximizeToggleProps {
  isMaximized: boolean;
  onToggle: () => void;
  className?: string;
}

export const MaximizeToggle: React.FC<MaximizeToggleProps> = ({
  isMaximized,
  onToggle,
  className = '',
}) => {
  return (
    <button
      type="button"
      className={`maximize-toggle-btn ${className}`}
      data-testid="maximize-toggle-btn"
      onClick={onToggle}
      title={isMaximized ? '通常表示に戻す' : '全画面に最大化'}
      aria-label={isMaximized ? '通常表示に戻す' : '全画面に最大化'}
    >
      {isMaximized ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      <span className="maximize-label">{isMaximized ? '縮小' : '最大化'}</span>
    </button>
  );
};
