import { motion } from "framer-motion";

export type StatusColor = 'optimal' | 'danger' | 'detraining' | 'neutral';

interface PremiumGaugeProps {
  label: string;
  value: number | string;
  status: StatusColor;
  percentage: number; // 0 to 100
  type?: 'acwr' | 'zscore';
  // ... other code above is handled by previous replace
}

export const PremiumGauge = ({ label, value, status, percentage, type = 'zscore', subLabel }: PremiumGaugeProps) => {
  const getTheme = (s: StatusColor) => {
    switch (s) {
      case 'optimal': return { text: 'text-[#4ade80]' };
      case 'danger':  return { text: 'text-[#f87171]' };
      case 'detraining': return { text: 'text-[#60a5fa]' };
      default: return { text: 'text-zinc-400' };
    }
  };

  const theme = getTheme(status);

  // SVG metrics for a half donut
  const dashArray = 125.66;
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const dashOffset = dashArray - (dashArray * clampedPct) / 100;
  
  const gradientId = `gauge-grad-${type}-${label.replace(/\s+/g, '')}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="font-mono text-[11px] tracking-[0.15em] text-white uppercase mb-3 font-semibold"
        style={{ textShadow: "0px 0px 8px rgba(255,255,255,0.5)" }}
      >
        {label}
      </div>
      
      <div className="relative w-24 h-14 overflow-hidden mb-2">
        <svg viewBox="0 0 100 60" className="w-full h-full transform translate-y-1 overflow-visible">
          <defs>
            {type === 'acwr' ? (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="30%" stopColor="#60a5fa" />
                <stop offset="42%" stopColor="#4ade80" />
                <stop offset="68%" stopColor="#4ade80" />
                <stop offset="80%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            ) : (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="20%" stopColor="#f87171" />
                <stop offset="30%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#4ade80" />
                <stop offset="60%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            )}
          </defs>

          {/* Track background */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.2"
          />
          {/* Animated fill path */}
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
            style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.2))' }}
          />
          {/* Needle / Flechita */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: -90 + (clampedPct * 1.8) }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <rect x="0" y="0" width="100" height="100" fill="transparent" pointerEvents="none" />
            <line x1="50" y1="50" x2="50" y2="12" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3.5" fill="rgba(255,255,255,0.95)" />
          </motion.g>
        </svg>
      </div>

      <div className={`font-mono text-xl font-semibold tracking-tight ${theme.text}`}>
        {value}
      </div>
      
      {subLabel && (
        <div 
          className="mt-0.5 text-[9px] font-sans font-medium text-white/90 uppercase tracking-widest text-center whitespace-nowrap"
          style={{ textShadow: "0px 0px 6px rgba(255,255,255,0.4)" }}
        >
          {subLabel}
        </div>
      )}
    </div>
  );
};
