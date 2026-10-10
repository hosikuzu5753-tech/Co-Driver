// frontend/src/components/simulator/DemoSimulatorControl.tsx

import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, MessageSquarePlus } from 'lucide-react';
import { triggerHaptic } from '../../utils/audioFeedback';

export interface DemoSimulatorControlProps {
  isDemoMode: boolean;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onSeekOffset: (offsetSeconds: number) => void;
  onInjectNotification: () => void;
  className?: string;
}

export const DemoSimulatorControl: React.FC<DemoSimulatorControlProps> = ({
  isDemoMode,
  isPlaying,
  onTogglePlayPause,
  onSeekOffset,
  onInjectNotification,
  className = '',
}) => {
  if (!isDemoMode) {
    return null;
  }

  const handlePlayToggle = () => {
    triggerHaptic(15);
    onTogglePlayPause();
  };

  const handleSeek = (sec: number) => {
    triggerHaptic(10);
    onSeekOffset(sec);
  };

  const handleNotif = () => {
    triggerHaptic([20, 40]);
    onInjectNotification();
  };

  return (
    <aside
      className={`demo-simulator-floating-panel ${className}`}
      data-testid="demo-simulator-control"
      aria-label="デモシミュレーター制御パネル"
    >
      <div className="sim-header-row">
        <span className="sim-badge">DEMO SIMULATOR</span>
        <span className="sim-status-hint">オフライン検証モード動作中</span>
      </div>

      <div className="sim-buttons-group">
        <button
          type="button"
          className="sim-btn sim-seek-btn"
          onClick={() => handleSeek(-10)}
          title="10秒戻る"
          aria-label="10秒戻る"
        >
          <RotateCcw size={16} />
          <span>-10s</span>
        </button>

        <button
          type="button"
          className={`sim-btn sim-play-btn ${isPlaying ? 'playing' : 'paused'}`}
          onClick={handlePlayToggle}
          title={isPlaying ? '一時停止' : '再生'}
          aria-label={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          type="button"
          className="sim-btn sim-seek-btn"
          onClick={() => handleSeek(10)}
          title="10秒進む"
          aria-label="10秒進む"
        >
          <RotateCw size={16} />
          <span>+10s</span>
        </button>

        <button
          type="button"
          className="sim-btn sim-notif-btn"
          onClick={handleNotif}
          title="LINE通知をテスト送信"
          aria-label="LINE通知をテスト送信"
        >
          <MessageSquarePlus size={18} />
          <span>LINE通知テスト</span>
        </button>
      </div>
    </aside>
  );
};
