// src/components/header/DigitalClock.tsx

import React from 'react';
import { useClock } from '../../hooks/useClock';

export interface DigitalClockProps {
  showDate?: boolean;
  className?: string;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  showDate = true,
  className = '',
}) => {
  const { time, fullDate } = useClock();

  return (
    <div className={`digital-clock font-mono ${className}`} data-testid="digital-clock">
      <div className="clock-time font-mono" data-testid="clock-time">
        {time}
      </div>
      {showDate && (
        <div className="clock-date font-mono" data-testid="clock-date">
          {fullDate}
        </div>
      )}
    </div>
  );
};
