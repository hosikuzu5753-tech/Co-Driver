// frontend/src/components/subpanel/NotificationToast.tsx

import React from 'react';
import { NotificationPayload } from '../../types/protocol';
import { MessageSquare, X } from 'lucide-react';

export interface NotificationToastProps {
  notification: NotificationPayload | null;
  onDismiss: () => void;
  className?: string;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  className = '',
}) => {
  if (!notification) {
    return null;
  }

  return (
    <div
      className={`notification-toast-container ${className}`}
      data-testid="notification-toast"
      onClick={onDismiss}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-card">
        {/* App & Sender Header */}
        <div className="toast-header-row">
          <div className="toast-sender-info">
            <span className="toast-line-badge">
              <MessageSquare size={14} className="toast-badge-icon" />
              {notification.app || 'LINE'}
            </span>
            <span className="toast-sender-name" data-testid="toast-title">
              {notification.title}
            </span>
          </div>

          <button
            type="button"
            className="toast-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            title="閉じる"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Content */}
        <div className="toast-body-text" data-testid="toast-text">
          {notification.text}
        </div>

        {/* 4000ms auto-dismiss progress bar */}
        <div className="toast-progress-bar" key={notification.id} />
      </div>
    </div>
  );
};
