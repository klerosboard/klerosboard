import React from 'react';

export default function CoherenceGraph({ value }: { value: number }) {
  const safeValue = isNaN(value) || value === undefined ? 0 : value;

  const size = 120;
  const center = size / 2;
  const radius = 42;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = (safeValue / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="coherenceGradient" x1="1" y1="1" x2="0" y2="0">
            <stop offset="66.37%" stopColor="#9013FE" stopOpacity={1} />
            <stop offset="82.15%" stopColor="#009AFF" stopOpacity={1} />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e5e5" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#coherenceGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '14px',
          color: '#333',
          pointerEvents: 'none',
        }}
      >
        {`${safeValue} %`}
      </div>
    </div>
  );
}
