import React, { forwardRef } from "react";

export interface LightingStatusWheelProps {
  functional: number;
  total: number;
  size?: number; // px
  onClick?: () => void;
  title?: string;
}

export const LightingStatusWheel = forwardRef<HTMLButtonElement, LightingStatusWheelProps>(
  ({ functional, total, size = 36, onClick, title }, ref) => {
  const clampedTotal = Math.max(0, total || 0);
  const clampedFunctional = Math.min(Math.max(0, functional || 0), clampedTotal);
  const pct = clampedTotal === 0 ? 0 : clampedFunctional / clampedTotal;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const gap = c - dash;

  const color = clampedTotal === 0
    ? "#94a3b8" // slate-400 if unknown
    : pct >= 0.8
      ? "#16a34a" // green-600
      : pct >= 0.4
        ? "#f59e0b" // amber-500
        : "#dc2626"; // red-600

  return (
    <button
      type="button"
      onClick={onClick}
      title={title || `${clampedFunctional}/${clampedTotal} lights functional`}
      className="inline-flex items-center justify-center rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      style={{ width: size, height: size }}
      ref={ref}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size/2}
          cy={size/2}
          r={r}
          fill="none"
          stroke="#e5e7eb" /* gray-200 */
          strokeWidth={stroke}
        />
        <circle
          cx={size/2}
          cy={size/2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
    </button>
  );
});

LightingStatusWheel.displayName = 'LightingStatusWheel';
