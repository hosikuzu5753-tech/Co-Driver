// src/components/header/QuickActions.tsx

import React from 'react';
import { Calculator, Maximize2, Minimize2, Sparkles, Sun } from 'lucide-react';

export interface QuickActionsProps {
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onOpenCalculator: () => void;
  isDemoMode: boolean;
  onToggleDemo: () => void;
  isWakeLocked: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  isMaximized,
  onToggleMaximize,
  onOpenCalculator,
  isDemoMode,
  onToggleDemo,
  isWakeLocked,
}) => {
  return (
    <div className="quick-actions" data-testid="quick-actions">
      {/* WakeLock Active Indicator */}
      <div
        className={`action-btn ${isWakeLocked ? 'active' : ''}`}
        style={{ cursor: 'default' }}
        title={isWakeLocked ? '画面常時点灯（Wake Lock 有効）' : 'Wake Lock 待機中'}
        data-testid="wake-lock-status"
      >
        <Sun size={22} />
      </div>

      {/* Demo Mode Toggle Button */}
      <button
        onClick={onToggleDemo}
        className={`action-btn ${isDemoMode ? 'demo-active' : ''}`}
        title={isDemoMode ? 'デモモード中（クリックで解除）' : 'デモモード開始'}
        data-testid="btn-demo"
        aria-label="デモモード切替"
      >
        <Sparkles size={22} />
      </button>

      {/* Calculator Modal Trigger Button */}
      <button
        onClick={onOpenCalculator}
        className="action-btn"
        title="車載大型電卓を開く"
        data-testid="btn-calculator"
        aria-label="電卓を開く"
      >
        <Calculator size={22} />
      </button>

      {/* Maximize / Dual-pane Toggle Button */}
      <button
        onClick={onToggleMaximize}
        className={`action-btn ${isMaximized ? 'active' : ''}`}
        title={isMaximized ? '通常画面に戻す' : '大画面歌詞表示（最大化）'}
        data-testid="btn-maximize"
        aria-label={isMaximized ? '元に戻す' : '最大化'}
      >
        {isMaximized ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
      </button>
    </div>
  );
};
