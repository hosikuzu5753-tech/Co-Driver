// frontend/src/components/subpanel/NotificationCard.tsx

import React from 'react';
import { NotificationPayload } from '../../types/protocol';

interface NotificationCardProps {
  notification: NotificationPayload;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification }) => {
  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className="notif-card"
      data-testid="notification-card"
      data-notif-id={notification.id}
    >
      <div className="notif-card-header">
        <div className="notif-app-badge">
          <span className="notif-line-pill">{notification.app || 'LINE'}</span>
          <span className="notif-sender">{notification.title}</span>
        </div>
        <span className="notif-timestamp">{formatTime(notification.timestamp)}</span>
      </div>

      <div className="notif-card-body">{notification.text}</div>
    </div>
  );
};
