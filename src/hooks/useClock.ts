// src/hooks/useClock.ts

import { useState, useEffect } from 'react';

export interface ClockState {
  time: string;       // HH:mm:ss
  date: string;       // YYYY.MM.DD
  weekday: string;    // (FRI) / (金)
  fullDate: string;   // YYYY.MM.DD (ddd)
  rawDate: Date;
}

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

function formatClockState(now: Date): ClockState {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const time = `${hours}:${minutes}:${seconds}`;

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const date = `${year}.${month}.${day}`;

  const weekday = `(${WEEKDAYS_JA[now.getDay()]})`;
  const fullDate = `${date} ${weekday}`;

  return {
    time,
    date,
    weekday,
    fullDate,
    rawDate: now,
  };
}

export function useClock(): ClockState {
  const [clock, setClock] = useState<ClockState>(() => formatClockState(new Date()));

  useEffect(() => {
    // Immediate alignment to next second boundary
    const update = () => {
      setClock(formatClockState(new Date()));
    };

    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return clock;
}
