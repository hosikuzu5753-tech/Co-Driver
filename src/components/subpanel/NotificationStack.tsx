// frontend/src/components/subpanel/NotificationStack.tsx

import React from 'react';
import { MessageSquare, Trash2, BellOff } from 'lucide-react';
import { NotificationPayload } from '../../types/protocol';
import { NotificationCard } from './NotificationCard';
import { triggerHaptic } from '../../utils/audioFeedback';

export interface NotificationStackProps {
  notifications: NotificationPayload[];
  onClearAll?: () => void;
  className?: string;
}

export const NotificationStack: React.FC<NotificationStackProps> = ({
  notifications,
  onClearAll,
  className = '',
}) => {
  const handleClear = () => {
    triggerHaptic(15);
    onClearAll?.();
  };

  return (
    <div
      className={`notification-stack-container ${className}`}
      data-testid="notification-stack"
    >
      {/* Header Row */}
      <div className="notif-stack-header">
        <div className="notif-header-title">
          <MessageSquare size={18} className="notif-icon-line" />
          <span className="notif-title-text">LINE 通知</span>
          <span className="notif-count-badge" data-testid="notif-count-badge">
            {notifications.length}件
          </span>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            className="notif-clear-btn"
            data-testid="notif-clear-btn"
            onClick={handleClear}
            title="通知をすべて消去"
            aria-label="通知をすべて消去"
          >
            <Trash2 size={16} />
            <span>すべて消去</span>
          </button>
        )}
      </div>

      {/* Cards List or Empty State */}
      <div className="notif-stack-list" data-testid="notif-stack-list">
        {notifications.length === 0 ? (
          <div className="notif-empty-state" data-testid="notif-empty-state">
            <BellOff size={32} className="empty-bell-icon" />
            <p className="empty-label">新着通知はありません</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationCard key={notif.id} notification={notif} />
          ))
        )}
      </div>
    </div>
  );
};
