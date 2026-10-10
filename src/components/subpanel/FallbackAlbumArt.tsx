// frontend/src/components/subpanel/FallbackAlbumArt.tsx

import React from 'react';

interface FallbackAlbumArtProps {
  size?: number;
  isPlaying?: boolean;
  className?: string;
}

export const FallbackAlbumArt: React.FC<FallbackAlbumArtProps> = ({
  size = 100,
  isPlaying = false,
  className = '',
}) => {
  return (
    <div
      className={`fallback-album-art ${isPlaying ? 'spinning' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#12100d',
        border: '1px solid #3d2d14',
      }}
      data-testid="fallback-album-art"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="vinylGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9e00" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#1a140a" />
            <stop offset="100%" stopColor="#0a0805" />
          </radialGradient>
          <linearGradient id="labelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff9e00" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer vinyl body */}
        <circle cx="50" cy="50" r="48" fill="#181512" stroke="#2e251a" strokeWidth="1.5" />

        {/* Concentric grooved rings */}
        <circle cx="50" cy="50" r="42" stroke="#252019" strokeWidth="1" strokeDasharray="4 2" />
        <circle cx="50" cy="50" r="36" stroke="#201a14" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" stroke="#252019" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="24" stroke="#201a14" strokeWidth="1" />

        {/* Amber center label */}
        <circle cx="50" cy="50" r="18" fill="url(#labelGrad)" stroke="#ffb733" strokeWidth="1" />

        {/* Spindle hole */}
        <circle cx="50" cy="50" r="4.5" fill="#0a0a0c" stroke="#ff9e00" strokeWidth="1" />
      </svg>
    </div>
  );
};
