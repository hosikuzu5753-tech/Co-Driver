// src/types/connection.ts

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'demo';

export interface ConnectionState {
  status: ConnectionStatus;
  host: string;
  port: number;
  latencyMs?: number;
  retryCount: number;
  lastConnectedTimestamp?: number;
}
