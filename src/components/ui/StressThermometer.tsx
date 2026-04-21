import { motion } from "framer-motion";

interface StressThermometerProps {
  label: string;
  shortLabel: string;
  value: number; // Z-score based (typically -3 to +3)
  description?: string;
}

/**
 * A half-gauge "thermometer" that visualizes stress on a gradient
 * from green (low stress / negative Z) to red (high stress / positive Z).
 * Reuses the same visual language as PremiumGauge but with a stress-specific palette.
 */
export const StressThermometer = ({ label, shortLabel, value, description }: StressThermometerProps) => {
  // Map Z-score to 0-100 percentage for the gauge.
  // Z = -3 → 0%, Z = 0 → 50%, Z = +3 → 100%
  const percentage = Math.max(0, Math.min(100, ((value + 3) / 6) * 100));

  const getStatusColor = (z: number) => {
    if (z > 1.5) return 'text-[#f87171]';   // High stress — red
    if (z > 0.5) return 'text-[#fb923c]';   // Moderate stress — orange
    if (z > -0.5) return 'text-[#fbbf24]';  // Normal — yellow
    return 'text-[#4ade80]';                // Low stress — green
  };

  const getStatusLabel = (z: number) => {
    if (z > 1.5) return 'Alto';
    if (z > 0.5) return 'Moderado';
    if (z > -0.5) return 'Normal';
    return 'Bajo';
  };

  // SVG metrics for a half donut (same as PremiumGauge)
  const dashArray = 125.66;
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const dashOffset = dashArray - (dashArray * clampedPct) / 100;
  const gradientId = `stress-grad-${shortLabel.replace(/\s+/g, '')}`;

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div
        className="font-mono text-[9px] tracking-[0.15em] text-white/50 uppercase mb-3 font-semibold text-center"
      >
        {label}
      </div>

      <div className="relative w-24 h-14 overflow-hidden mb-1">
        <svg viewBox="0 0 100 60" className="w-full h-full transform translate-y-1 overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="30%" stopColor="#4ade80" />
              <stop offset="45%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#fb923c" />
              <stop offset="80%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>

          {/* Track background */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.15"
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
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.15))' }}
          />
          {/* Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: -90 + (clampedPct * 1.8) }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <rect x="0" y="0" width="100" height="100" fill="transparent" pointerEvents="none" />
            <line x1="50" y1="50" x2="50" y2="14" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.9)" />
          </motion.g>
        </svg>
      </div>

      <div className={`font-mono text-xl font-semibold tracking-tight ${getStatusColor(value)}`}>
        {(value > 0 ? "+" : "") + value.toFixed(1)}
      </div>
      
      <div 
        className="mt-0.5 text-[9px] font-sans font-medium text-white/90 uppercase tracking-widest text-center whitespace-nowrap"
        style={{ textShadow: "0px 0px 6px rgba(255,255,255,0.4)" }}
      >
        {getStatusLabel(value)}
      </div>
      {description && (
        <div className="mt-1 text-[9px] font-sans text-white/30 text-center leading-tight px-1">
          {description}
        </div>
      )}
    </div>
  );
};
