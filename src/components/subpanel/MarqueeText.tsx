// frontend/src/components/subpanel/MarqueeText.tsx

import React, { useRef, useEffect, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // px per second
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const [overflowDistance, setOverflowDistance] = useState<number>(0);

  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (container && textEl) {
        const overflow = textEl.scrollWidth > container.clientWidth;
        setIsOverflowing(overflow);
        if (overflow) {
          setOverflowDistance(textEl.scrollWidth - container.clientWidth);
        } else {
          setOverflowDistance(0);
        }
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  // Duration proportional to overflow distance (minimum 5s, max 14s)
  const duration = Math.min(14, Math.max(5, overflowDistance / 25));

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${className}`}
      data-testid="marquee-text-container"
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        width: '100%',
      }}
    >
      <span
        ref={textRef}
        className={`marquee-text ${isOverflowing ? 'animate-marquee' : ''}`}
        style={
          isOverflowing
            ? ({
                display: 'inline-block',
                animation: `marquee-scroll ${duration}s ease-in-out infinite alternate`,
                ['--marquee-distance' as any]: `-${overflowDistance + 8}px`,
              } as React.CSSProperties)
            : { display: 'inline-block' }
        }
      >
        {text}
      </span>
    </div>
  );
};
