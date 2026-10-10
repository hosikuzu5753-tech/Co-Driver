// src/components/header/ConnectionIndicator.tsx

import React from 'react';
import { ConnectionStatus } from '../../types/connection';

export interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  host?: string;
  latencyMs?: number;
  onClick?: () => void;
  className?: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  host,
  latencyMs,
  onClick,
  className = '',
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return latencyMs ? `ONLINE (${latencyMs}ms)` : 'ONLINE';
      case 'connecting':
        return 'RECONNECTING...';
      case 'demo':
        return 'DEMO MODE';
      case 'disconnected':
      default:
        return 'OFFLINE';
    }
  };

  const getLedClass = () => {
    switch (status) {
      case 'connected':
        return 'led-connected';
      case 'connecting':
        return 'led-connecting';
      case 'demo':
        return 'led-demo';
      case 'disconnected':
      default:
        return 'led-disconnected';
    }
  };

  return (
    <div
      className={`connection-indicator ${className}`}
      onClick={onClick}
      data-testid="connection-indicator"
      data-status={status}
      title={host ? `Host: ${host} (Status: ${status})` : `Status: ${status}`}
    >
      <span className={`led-dot ${getLedClass()}`} />
      <span>{getStatusText()}</span>
    </div>
  );
};
