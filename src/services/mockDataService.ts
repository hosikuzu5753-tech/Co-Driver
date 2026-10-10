// frontend/src/services/mockDataService.ts

import { MediaStatePayload, NotificationPayload } from '../types/protocol';

/**
 * Offline-capable dark amber SVG album art for cockpit display.
 */
export const MOCK_ALBUM_ART_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231a1505"/><stop offset="50%" stop-color="%232b200a"/><stop offset="100%" stop-color="%230d0a04"/></linearGradient><linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23ff9e00"/><stop offset="100%" stop-color="%23ffb733"/></linearGradient></defs><rect width="300" height="300" rx="16" fill="url(%23bg)" stroke="%23ff9e00" stroke-width="3"/><circle cx="150" cy="140" r="70" fill="none" stroke="url(%23accent)" stroke-width="4" stroke-dasharray="8 6"/><polygon points="140,115 170,140 140,165" fill="%23ff9e00"/><text x="150" y="240" font-family="monospace" font-size="16" font-weight="bold" fill="%23ffb733" text-anchor="middle" letter-spacing="2">SNOW POWDER HIGHWAY</text><text x="150" y="265" font-family="monospace" font-size="12" fill="%23a07820" text-anchor="middle">CO-DRIVER SOUNDTRACK</text></svg>`;

/**
 * Realistic Japanese LRC lyrics for the demo song (3:00 duration).
 */
export const MOCK_LRC_CONTENT = `[ti:Snow Powder Highway]
[ar:Co-Driver Studio feat. Takasu Drift]
[al:Winter Cockpit Melodies 2026]
[length:03:00]
[00:00.00]♪ 〜 イントロ (夜明けのハイウェイ) 〜
[00:10.00]凍てつく夜を切り裂いて
[00:18.50]アンバーの光が照らすフロントガラス
[00:27.00]標高が上がるたび 白く染まる木々たち
[00:35.50]静寂のパウダースノーが僕らを呼んでいる
[00:44.00]談合坂を抜けて 峠の向こうへ
[00:52.50]メーターの針とともに高鳴る鼓動
[01:00.00]♪ 〜 サビ 〜
[01:01.50]白銀のハイウェイを駆け抜けろ
[01:10.00]誰もまだ踏み荒らしていないバーンへ
[01:18.50]冷たい風が車体を揺らしても
[01:27.00]この温もりとリズムは止まらない
[01:36.00]♪ 〜 間奏 〜
[01:45.00]トンネルを越えれば 高鷲の雪景色
[01:53.50]ミラーに映る朝焼けが綺麗だねと
[02:02.00]君が笑った瞬間に
[02:10.50]最高のシーズンが今 幕を開ける
[02:18.00]♪ 〜 ラストサビ 〜
[02:19.50]パウダーの彼方へ どこまでも行こう
[02:28.00]僕らの Co-Driver 夢を乗せて走る
[02:40.00]♪ 〜 アウトロ (ゲレンデ到着) 〜
`;

/**
 * Realistic LINE notification templates for driving & ski road trips.
 */
export const MOCK_LINE_NOTIFICATIONS: Omit<NotificationPayload, 'id' | 'timestamp'>[] = [
  {
    app: 'LINE',
    packageName: 'jp.naver.line.android',
    title: '佐藤 健 (スノボ仲間)',
    text: '談合坂SAで待ってるね！温かいコーヒー買っておくよ。',
  },
  {
    app: 'LINE',
    packageName: 'jp.naver.line.android',
    title: '高鷲スノーパーク公式',
    text: '【速報】山頂積雪180cm！新雪25cmの極上パウダースノーです。全リフト運行中！',
  },
  {
    app: 'LINE',
    packageName: 'jp.naver.line.android',
    title: '美咲 (助手席)',
    text: 'このプレイリスト最高！次の曲も楽しみにしてるね♪',
  },
  {
    app: 'LINE',
    packageName: 'jp.naver.line.android',
    title: '道路交通情報センター',
    text: '中央道 恵那山トンネル先、チェーン規制開始。路面凍結にご注意ください。',
  },
  {
    app: 'LINE',
    packageName: 'jp.naver.line.android',
    title: 'ダイナランド運営部',
    text: 'ナイター営業実施中！山頂連絡コース開放しました。',
  },
];

export class MockDataService {
  private static notifIndex = 0;
  private static simTimer: ReturnType<typeof setInterval> | null = null;
  private static isPlaying = true;
  private static positionMs = 0;
  private static readonly DURATION_MS = 180000; // 3 minutes

  public static getCurrentMediaState(): MediaStatePayload {
    return {
      track: 'Snow Powder Highway',
      artist: 'Co-Driver Studio feat. Takasu Drift',
      album: 'Winter Cockpit Melodies 2026',
      albumArtUrl: MOCK_ALBUM_ART_SVG,
      positionMs: this.positionMs,
      durationMs: this.DURATION_MS,
      isPlaying: this.isPlaying,
      playbackSpeed: 1.0,
    };
  }

  public static startPlaybackSimulation(
    onTick: (media: MediaStatePayload) => void,
    intervalMs = 250
  ): () => void {
    this.stopPlaybackSimulation();
    this.simTimer = setInterval(() => {
      if (this.isPlaying) {
        this.positionMs += intervalMs;
        if (this.positionMs >= this.DURATION_MS) {
          this.positionMs = 0; // Loop around
        }
        onTick(this.getCurrentMediaState());
      }
    }, intervalMs);

    return () => this.stopPlaybackSimulation();
  }

  public static stopPlaybackSimulation(): void {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  public static togglePlayPause(): boolean {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  public static setPlayState(playing: boolean): void {
    this.isPlaying = playing;
  }

  public static seek(targetMs: number): void {
    this.positionMs = Math.max(0, Math.min(this.DURATION_MS, Math.floor(targetMs)));
  }

  public static generateNextNotification(): NotificationPayload {
    const template = MOCK_LINE_NOTIFICATIONS[this.notifIndex % MOCK_LINE_NOTIFICATIONS.length];
    this.notifIndex++;

    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      app: template.app,
      packageName: template.packageName,
      title: template.title,
      text: template.text,
      timestamp: Date.now(),
    };
  }
}
