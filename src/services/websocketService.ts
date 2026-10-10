// frontend/src/services/websocketService.ts

import {
  WsEnvelope,
  MediaStatePayload,
  NotificationPayload,
  DeviceStatusPayload,
  CommandPlayPausePayload,
  CommandSeekPayload,
  GetStatePayload,
  PingPayload,
} from '../types/protocol';
import { ConnectionState, ConnectionStatus } from '../types/connection';
import { QrParser } from '../utils/qrParser';

export type MediaStateListener = (media: MediaStatePayload) => void;
export type NotificationListener = (notification: NotificationPayload) => void;
export type DeviceStatusListener = (status: DeviceStatusPayload) => void;
export type ConnectionStateListener = (state: ConnectionState) => void;

export class WebSocketService {
  private static instance: WebSocketService | null = null;

  private socket: WebSocket | null = null;
  private currentHost: string = '192.168.43.1';
  private currentPort: number = 8080;
  private isExplicitlyClosed: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private lastPingSentTime: number = 0;
  private lastPongReceivedTime: number = 0;
  private lastAcceptedMediaTimestamp: number = 0;

  // Connection state
  private connectionState: ConnectionState = {
    status: 'disconnected',
    host: '192.168.43.1',
    port: 8080,
    retryCount: 0,
    latencyMs: undefined,
    lastConnectedTimestamp: undefined,
  };

  // Event listeners
  private mediaListeners: Set<MediaStateListener> = new Set();
  private notificationListeners: Set<NotificationListener> = new Set();
  private deviceStatusListeners: Set<DeviceStatusListener> = new Set();
  private connectionStateListeners: Set<ConnectionStateListener> = new Set();

  private constructor() {
    // Singleton
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server.
   */
  public connect(host?: string, port?: number): void {
    if (this.connectionState.status === 'demo') {
      return;
    }

    if (host && port) {
      this.currentHost = host;
      this.currentPort = port;
    } else {
      const target = QrParser.resolveConnectionTarget();
      this.currentHost = target.host;
      this.currentPort = target.port;
    }

    this.isExplicitlyClosed = false;
    this.clearReconnectTimer();
    this.closeExistingSocket();

    this.updateStatus('connecting');

    const wsUrl = `ws://${this.currentHost}:${this.currentPort}`;

    try {
      this.socket = new WebSocket(wsUrl);
      this.setupSocketHandlers();
    } catch {
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect socket cleanly.
   */
  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.closeExistingSocket();
    this.updateStatus('disconnected', { retryCount: 0, latencyMs: undefined });
  }

  /**
   * Schedule automatic reconnect with exponential backoff (1s -> 2s -> 4s -> max 8s).
   */
  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed || this.connectionState.status === 'demo') {
      return;
    }

    this.clearReconnectTimer();
    const currentAttempt = this.connectionState.retryCount;
    // 1000ms * 2^attempt, capped at 8000ms
    const delayMs = Math.min(8000, 1000 * Math.pow(2, currentAttempt));

    this.updateStatus('connecting', {
      retryCount: currentAttempt + 1,
      latencyMs: undefined,
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.currentHost, this.currentPort);
    }, delayMs);
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.updateStatus('connected', {
        retryCount: 0,
        lastConnectedTimestamp: Date.now(),
      });

      this.startHeartbeat();

      // Request initial state sync
      this.send({
        type: 'GET_STATE',
        payload: { target: 'all' } as GetStatePayload,
        timestamp: Date.now(),
      });
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      if (!this.isExplicitlyClosed && this.connectionState.status !== 'demo') {
        this.scheduleReconnect();
      } else {
        this.updateStatus('disconnected');
      }
    };

    this.socket.onerror = () => {
      // onclose handles reconnect
    };

    this.socket.onmessage = (event) => {
      this.handleIncomingMessage(event.data);
    };
  }

  /**
   * Parse incoming WebSocket envelope and dispatch to listeners.
   */
  private handleIncomingMessage(rawData: string | any): void {
    try {
      const text = typeof rawData === 'string' ? rawData : rawData.toString();
      const envelope: WsEnvelope = JSON.parse(text);

      if (!envelope || !envelope.type) {
        return;
      }

      switch (envelope.type) {
        case 'MEDIA_STATE':
          this.handleMediaState(envelope);
          break;

        case 'NOTIFICATION':
          this.handleNotification(envelope);
          break;

        case 'DEVICE_STATUS':
          this.handleDeviceStatus(envelope);
          break;

        case 'PONG':
          this.handlePong(envelope);
          break;

        default:
          break;
      }
    } catch {
      // Ignore JSON error
    }
  }

  /**
   * Handle MEDIA_STATE envelope with jitter protection (discards stale packets).
   */
  private handleMediaState(envelope: WsEnvelope<MediaStatePayload>): void {
    if (envelope.timestamp && envelope.timestamp < this.lastAcceptedMediaTimestamp) {
      return; // Discard stale delayed packet
    }
    this.lastAcceptedMediaTimestamp = envelope.timestamp || Date.now();

    const payload = envelope.payload;
    if (payload) {
      this.mediaListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch {
          // ignore
        }
      });
    }
  }

  /**
   * Handle incoming NOTIFICATION.
   */
  private handleNotification(envelope: WsEnvelope<NotificationPayload>): void {
    const payload = envelope.payload;
    if (payload && payload.id && payload.title) {
      this.notificationListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch {
          // ignore
        }
      });
    }
  }

  /**
   * Handle incoming DEVICE_STATUS.
   */
  private handleDeviceStatus(envelope: WsEnvelope<DeviceStatusPayload>): void {
    const payload = envelope.payload;
    if (payload) {
      this.deviceStatusListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch {
          // ignore
        }
      });
    }
  }

  /**
   * Handle PONG response to calculate round-trip latency.
   */
  private handlePong(envelope: WsEnvelope<any>): void {
    this.lastPongReceivedTime = Date.now();
    const sentTime = envelope.payload?.clientTime || this.lastPingSentTime;
    if (sentTime > 0) {
      const latency = Math.max(0, Date.now() - sentTime);
      this.updateStatus(this.connectionState.status, { latencyMs: latency });
    }
  }

  /**
   * Heartbeat Ping/Pong (every 10s).
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongReceivedTime = Date.now();

    this.pingIntervalTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // If 25 seconds elapsed with no pong/message, trigger reconnect
        if (Date.now() - this.lastPongReceivedTime > 25000 && this.lastPingSentTime > 0) {
          this.socket.close();
          return;
        }

        this.lastPingSentTime = Date.now();
        this.send({
          type: 'PING',
          payload: { clientTime: this.lastPingSentTime } as PingPayload,
          timestamp: this.lastPingSentTime,
        });
      }
    }, 10000);
  }

  private stopHeartbeat(): void {
    if (this.pingIntervalTimer) {
      clearInterval(this.pingIntervalTimer);
      this.pingIntervalTimer = null;
    }
  }

  /**
   * Send JSON envelope to WebSocket server.
   */
  public send(envelope: WsEnvelope): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.socket.send(JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }

  public sendPlayPause(action: 'toggle' | 'play' | 'pause' = 'toggle'): boolean {
    return this.send({
      type: 'COMMAND_PLAY_PAUSE',
      payload: { action } as CommandPlayPausePayload,
      timestamp: Date.now(),
    });
  }

  public sendSeek(positionMs: number): boolean {
    return this.send({
      type: 'COMMAND_SEEK',
      payload: { positionMs: Math.max(0, Math.floor(positionMs)) } as CommandSeekPayload,
      timestamp: Date.now(),
    });
  }

  public getState(target: 'all' | 'media' | 'device' = 'all'): boolean {
    return this.send({
      type: 'GET_STATE',
      payload: { target } as GetStatePayload,
      timestamp: Date.now(),
    });
  }

  /**
   * Mock dispatch methods for demo/simulator mode.
   */
  public dispatchMockMediaState(media: MediaStatePayload): void {
    this.mediaListeners.forEach((listener) => {
      try {
        listener(media);
      } catch {
        // ignore
      }
    });
  }

  public dispatchMockNotification(notif: NotificationPayload): void {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notif);
      } catch {
        // ignore
      }
    });
  }

  /**
   * Toggle demo mode.
   */
  public setDemoMode(enabled: boolean): void {
    if (enabled) {
      this.disconnect();
      this.updateStatus('demo', { retryCount: 0, latencyMs: 0 });
    } else {
      this.updateStatus('disconnected', { retryCount: 0, latencyMs: undefined });
      this.connect();
    }
  }

  // --- Listener subscriptions ---

  public onMediaState(listener: MediaStateListener): () => void {
    this.mediaListeners.add(listener);
    return () => this.mediaListeners.delete(listener);
  }

  public onNotification(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  public onDeviceStatus(listener: DeviceStatusListener): () => void {
    this.deviceStatusListeners.add(listener);
    return () => this.deviceStatusListeners.delete(listener);
  }

  public onConnectionState(listener: ConnectionStateListener): () => void {
    this.connectionStateListeners.add(listener);
    listener(this.connectionState); // Notify current state immediately
    return () => this.connectionStateListeners.delete(listener);
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  private updateStatus(status: ConnectionStatus, partial?: Partial<ConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      status,
      host: this.currentHost,
      port: this.currentPort,
      ...partial,
    };
    this.connectionStateListeners.forEach((l) => {
      try {
        l(this.connectionState);
      } catch {
        // ignore
      }
    });
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private closeExistingSocket(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
  }
}
