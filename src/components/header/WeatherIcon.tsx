// src/components/header/WeatherIcon.tsx

import React from 'react';
import { WeatherIconType } from '../../types/weather';

export interface WeatherIconProps {
  type: WeatherIconType;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  type,
  className = '',
  size = 20,
}) => {
  switch (type) {
    case 'sun':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={{ color: 'var(--cd-amber-primary)' }}
        >
          <circle cx="12" cy="12" r="5" fill="var(--cd-amber-primary)" fillOpacity="0.25" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    case 'snow':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={{ color: '#bae6fd' }}
        >
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="12" y1="8" x2="8" y2="4" />
          <line x1="12" y1="8" x2="16" y2="4" />
          <line x1="12" y1="16" x2="8" y2="20" />
          <line x1="12" y1="16" x2="16" y2="20" />
          <line x1="3.34" y1="7" x2="20.66" y2="17" />
          <line x1="20.66" y1="7" x2="3.34" y2="17" />
        </svg>
      );
    case 'rain':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={{ color: '#60a5fa' }}
        >
          <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
          <line x1="8" y1="19" x2="8" y2="21" />
          <line x1="8" y1="13" x2="8" y2="15" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="12" y1="15" x2="12" y2="17" />
          <line x1="16" y1="19" x2="16" y2="21" />
          <line x1="16" y1="13" x2="16" y2="15" />
        </svg>
      );
    case 'clouds':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          style={{ color: '#a69986' }}
        >
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      );
  }
};
