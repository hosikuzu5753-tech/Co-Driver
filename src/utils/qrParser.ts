// frontend/src/utils/qrParser.ts

export interface QrWsConnectionConfig {
  raw: string;      // e.g. "192.168.43.1:8080"
  host: string;     // e.g. "192.168.43.1"
  port: number;     // e.g. 8080
  wsUrl: string;    // e.g. "ws://192.168.43.1:8080"
}

export const QR_STORAGE_KEYS = {
  WS_HOST: 'codriver_ws_host',
  WS_CONFIG_V1: 'codriver_ws_config_v1',
} as const;

export class QrParser {
  private static readonly DEFAULT_FALLBACK_HOST = '192.168.43.1:8080';

  /**
   * Validate host and port syntax.
   * Host must be a valid IPv4 address (octets 0-255) or hostname.
   * Port must be an integer in range 1..65535.
   */
  public static validateHostPort(hostPortStr: string): { host: string; port: number } | null {
    if (!hostPortStr || typeof hostPortStr !== 'string') return null;
    const trimmed = hostPortStr.trim();

    const match = trimmed.match(/^([a-zA-Z0-9.-]+):(\d+)$/);
    if (!match) return null;

    const host = match[1];
    const port = parseInt(match[2], 10);

    // Port range check (1 to 65535)
    if (isNaN(port) || port < 1 || port > 65535) {
      return null;
    }

    // IPv4 octet check
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const octets = [
        parseInt(ipv4Match[1], 10),
        parseInt(ipv4Match[2], 10),
        parseInt(ipv4Match[3], 10),
        parseInt(ipv4Match[4], 10),
      ];
      if (octets.some((oct) => oct < 0 || oct > 255)) {
        return null;
      }
    }

    return { host, port };
  }

  /**
   * Parse ?ws=HOST:PORT from URL or query string.
   */
  public static parseWsParam(inputUrlOrSearch?: string): QrWsConnectionConfig | null {
    let wsParamValue: string | null = null;

    if (inputUrlOrSearch) {
      try {
        if (inputUrlOrSearch.startsWith('http://') || inputUrlOrSearch.startsWith('https://')) {
          const url = new URL(inputUrlOrSearch);
          wsParamValue = url.searchParams.get('ws');
        } else {
          const search = inputUrlOrSearch.startsWith('?') ? inputUrlOrSearch : `?${inputUrlOrSearch}`;
          const params = new URLSearchParams(search);
          wsParamValue = params.get('ws');
        }
      } catch {
        return null;
      }
    } else if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      wsParamValue = params.get('ws');
    }

    if (!wsParamValue) return null;

    const validated = this.validateHostPort(wsParamValue);
    if (!validated) return null;

    return {
      raw: `${validated.host}:${validated.port}`,
      host: validated.host,
      port: validated.port,
      wsUrl: `ws://${validated.host}:${validated.port}`,
    };
  }

  /**
   * Retrieve saved host from localStorage.
   */
  public static getSavedHost(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    const saved = localStorage.getItem(QR_STORAGE_KEYS.WS_HOST);
    if (saved && this.validateHostPort(saved)) {
      return saved;
    }

    // Check v1 config key
    try {
      const configJson = localStorage.getItem(QR_STORAGE_KEYS.WS_CONFIG_V1);
      if (configJson) {
        const parsed = JSON.parse(configJson);
        const combined = `${parsed.host}:${parsed.port}`;
        if (this.validateHostPort(combined)) {
          return combined;
        }
      }
    } catch {
      // Ignore JSON error
    }

    return null;
  }

  /**
   * Save host and port to localStorage.
   */
  public static saveHost(host: string, port: number = 8080): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const combined = `${host}:${port}`;
    if (!this.validateHostPort(combined)) return;

    localStorage.setItem(QR_STORAGE_KEYS.WS_HOST, combined);
    localStorage.setItem(
      QR_STORAGE_KEYS.WS_CONFIG_V1,
      JSON.stringify({ host, port, updatedAt: Date.now() })
    );
  }

  /**
   * Resolve connection target: URL query > localStorage > fallback default.
   */
  public static resolveConnectionTarget(defaultHost = this.DEFAULT_FALLBACK_HOST): QrWsConnectionConfig {
    // 1. URL Query Param
    const fromUrl = this.parseWsParam();
    if (fromUrl) {
      this.saveHost(fromUrl.host, fromUrl.port);
      this.cleanUrlQueryParam();
      return fromUrl;
    }

    // 2. localStorage
    const saved = this.getSavedHost();
    if (saved) {
      const valid = this.validateHostPort(saved)!;
      return {
        raw: saved,
        host: valid.host,
        port: valid.port,
        wsUrl: `ws://${valid.host}:${valid.port}`,
      };
    }

    // 3. Default fallback
    const def = this.validateHostPort(defaultHost) || { host: '192.168.43.1', port: 8080 };
    return {
      raw: `${def.host}:${def.port}`,
      host: def.host,
      port: def.port,
      wsUrl: `ws://${def.host}:${def.port}`,
    };
  }

  /**
   * Remove ?ws= query param from the browser address bar without reload.
   */
  public static cleanUrlQueryParam(): void {
    if (typeof window === 'undefined' || !window.history || !window.location) return;

    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('ws')) {
        url.searchParams.delete('ws');
        const newSearch = url.searchParams.toString();
        const cleanPath = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash;
        window.history.replaceState({}, document.title, cleanPath);
      }
    } catch {
      // Ignore
    }
  }
}
