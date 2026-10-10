// src/components/placeholder/LyricsPanelPlaceholder.tsx

import React from 'react';
import { Music, Radio } from 'lucide-react';

export const LyricsPanelPlaceholder: React.FC = () => {
  return (
    <div className="panel-placeholder" data-testid="lyrics-panel-placeholder">
      <div className="panel-header-title">
        <Music size={24} color="var(--cd-amber-primary)" />
        <span>歌詞同期メインパネル (Lyrics Sync Engine)</span>
      </div>

      <div className="placeholder-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <Radio size={36} color="var(--cd-amber-bright)" />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--cd-text-ivory)', marginBottom: '6px' }}>
          再生楽曲の同期歌詞待機中 (M2 Integrator)
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--cd-text-muted)' }}>
          Android中継ブリッジまたはデモシミュレータからのLRCミリ秒同期ストリームを受信すると、自動的にハイライト＆中央スクロール表示されます。
        </p>
      </div>

      <div
        style={{
          fontFamily: 'var(--cd-font-mono)',
          fontSize: '0.8rem',
          color: 'var(--cd-amber-subdued)',
        }}
      >
        [ 00:00.00 ] 準備完了 — 車載オーディオ待機中
      </div>
    </div>
  );
};
