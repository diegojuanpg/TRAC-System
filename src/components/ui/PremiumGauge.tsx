import { motion } from "framer-motion";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

export type StatusColor = 'optimal' | 'danger' | 'detraining' | 'neutral';

interface PremiumGaugeProps {
  label: string;
  value: number | string;
  status: StatusColor;
  percentage: number;
  type?: 'acwr' | 'zscore' | 'readiness' | 'fatigue_fitness';
  subLabel?: string;
}

export const PremiumGauge = ({ label, value, status, percentage, type = 'zscore', subLabel }: PremiumGaugeProps) => {
  const getValueColor = (s: StatusColor) => {
    switch (s) {
      case 'optimal':    return 'hsla(142,45%,68%,1)';  // muted green
      case 'danger':     return 'hsla(0,55%,68%,1)';    // muted red
      case 'detraining': return 'hsla(210,55%,70%,1)';  // muted blue
      default:           return 'hsla(0,0%,70%,1)';     // neutral
    }
  };

  const dashArray = 125.66;
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const dashOffset = dashArray - (dashArray * clampedPct) / 100;
  const gradientId = `gauge-grad-${type}-${label.replace(/\s+/g, '')}`;

  // Muted arc gradient colors
  const arcColors = {
    green:  '#6ee7a0',
    yellow: '#fcd34d',
    orange: '#fdba74',
    red:    '#fca5a5',
    blue:   '#93c5fd',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="text-[10px] tracking-[0.16em] text-white/60 uppercase mb-3 font-semibold"
        style={{ fontFamily: JAKARTA }}
      >
        {label}
      </div>

      <div className="relative w-24 h-14 overflow-hidden mb-2">
        <svg viewBox="0 0 100 60" className="w-full h-full transform translate-y-1 overflow-visible">
          <defs>
            {type === 'acwr' ? (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={arcColors.blue} />
                <stop offset="30%"  stopColor={arcColors.blue} />
                <stop offset="42%"  stopColor={arcColors.green} />
                <stop offset="68%"  stopColor={arcColors.green} />
                <stop offset="80%"  stopColor={arcColors.red} />
                <stop offset="100%" stopColor={arcColors.red} />
              </linearGradient>
            ) : type === 'readiness' ? (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={arcColors.red} />
                <stop offset="50%"  stopColor={arcColors.blue} />
                <stop offset="100%" stopColor={arcColors.green} />
              </linearGradient>
            ) : type === 'fatigue_fitness' ? (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={arcColors.green} />
                <stop offset="50%"  stopColor={arcColors.orange} />
                <stop offset="100%" stopColor={arcColors.red} />
              </linearGradient>
            ) : (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={arcColors.red} />
                <stop offset="30%"  stopColor={arcColors.green} />
                <stop offset="60%"  stopColor={arcColors.blue} />
                <stop offset="100%" stopColor={arcColors.blue} />
              </linearGradient>
            )}
          </defs>

          {/* Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.18"
          />
          {/* Fill */}
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            initial={{ strokeDashoffset: dashArray }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ filter: 'drop-shadow(0px 0px 3px rgba(255,255,255,0.15))' }}
          />
          {/* Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: -90 + (clampedPct * 1.8) }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <rect x="0" y="0" width="100" height="100" fill="transparent" pointerEvents="none" />
            <line x1="50" y1="50" x2="50" y2="12" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3.5" fill="rgba(255,255,255,0.9)" />
          </motion.g>
        </svg>
      </div>

      <div
        className="text-xl font-semibold tracking-tight"
        style={{ fontFamily: OUTFIT, color: getValueColor(status) }}
      >
        {value}
      </div>

      {subLabel && (
        <div
          className="mt-0.5 text-[9px] font-medium text-white/75 uppercase tracking-[0.12em] text-center whitespace-nowrap"
          style={{ fontFamily: JAKARTA }}
        >
          {subLabel}
        </div>
      )}
    </div>
  );
};
