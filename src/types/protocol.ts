// src/types/protocol.ts

export type MessageType =
  | 'MEDIA_STATE'
  | 'NOTIFICATION'
  | 'DEVICE_STATUS'
  | 'PING'
  | 'PONG'
  | 'COMMAND_PLAY_PAUSE'
  | 'COMMAND_SEEK'
  | 'GET_STATE';

export interface WsEnvelope<T = any> {
  type: MessageType | string;
  payload: T;
  timestamp: number;
}

export interface MediaStatePayload {
  track: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  playbackSpeed?: number;
}

export interface NotificationPayload {
  id: string;
  app: string;
  packageName: string;
  title: string;
  text: string;
  timestamp: number;
}

export interface DeviceStatusPayload {
  ipAddress: string;
  port: number;
  isTethering: boolean;
  clientsCount: number;
}

export interface CommandPlayPausePayload {
  action?: 'toggle' | 'play' | 'pause';
}

export interface CommandSeekPayload {
  positionMs: number;
}

export interface GetStatePayload {
  target?: 'all' | 'media' | 'device';
}

export interface PingPayload {
  clientTime: number;
}

export interface PongPayload {
  clientTime?: number;
  serverTime?: number;
}
