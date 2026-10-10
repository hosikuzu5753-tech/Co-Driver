// src/components/placeholder/SubPanelPlaceholder.tsx

import React from 'react';
import { Disc3, MessageSquare } from 'lucide-react';

export const SubPanelPlaceholder: React.FC = () => {
  return (
    <div className="panel-placeholder" data-testid="sub-panel-placeholder">
      <div className="panel-header-title">
        <Disc3 size={24} color="var(--cd-amber-primary)" />
        <span>サブパネル (Spotify & LINE)</span>
      </div>

      <div className="placeholder-card" style={{ marginBottom: '10px' }}>
        <p style={{ fontWeight: 600, color: 'var(--cd-text-ivory)', marginBottom: '4px' }}>
          🎵 Spotify プレイヤーリモート
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--cd-text-muted)' }}>
          アルバムアート・曲名・アーティスト・シークバー・再生制御
        </p>
      </div>

      <div className="placeholder-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <MessageSquare size={18} color="var(--cd-status-connected)" />
          <span style={{ fontWeight: 600, color: 'var(--cd-text-ivory)' }}>
            💬 LINE 通知履歴スタック
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--cd-text-muted)' }}>
          受信メッセージのタイムスタンプ履歴表示（M2で展開）
        </p>
      </div>
    </div>
  );
};
