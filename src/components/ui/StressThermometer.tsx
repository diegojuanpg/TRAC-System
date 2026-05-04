import { motion } from "framer-motion";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface StressThermometerProps {
  label: string;
  shortLabel: string;
  value: number;
  description?: string;
}

export const StressThermometer = ({ label, shortLabel, value, description }: StressThermometerProps) => {
  const percentage = Math.max(0, Math.min(100, ((value + 3) / 6) * 100));

  const getValueColor = (z: number) => {
    if (z > 1.5)  return 'hsla(0,55%,68%,1)';    // muted red
    if (z > 0.5)  return 'hsla(25,65%,70%,1)';   // muted orange
    if (z > -0.5) return 'hsla(45,60%,72%,1)';   // muted yellow
    return 'hsla(142,45%,68%,1)';                  // muted green
  };

  const getStatusLabel = (z: number) => {
    if (z > 1.5)  return 'Alto';
    if (z > 0.5)  return 'Moderado';
    if (z > -0.5) return 'Normal';
    return 'Bajo';
  };

  const dashArray = 125.66;
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const dashOffset = dashArray - (dashArray * clampedPct) / 100;
  const gradientId = `stress-grad-${shortLabel.replace(/\s+/g, '')}`;

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div
        className="text-[9px] tracking-[0.16em] text-white/55 uppercase mb-3 font-semibold text-center"
        style={{ fontFamily: JAKARTA }}
      >
        {label}
      </div>

      <div className="relative w-24 h-14 overflow-hidden mb-1">
        <svg viewBox="0 0 100 60" className="w-full h-full transform translate-y-1 overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#6ee7a0" />
              <stop offset="30%"  stopColor="#6ee7a0" />
              <stop offset="50%"  stopColor="#fcd34d" />
              <stop offset="65%"  stopColor="#fdba74" />
              <stop offset="85%"  stopColor="#fca5a5" />
              <stop offset="100%" stopColor="#fca5a5" />
            </linearGradient>
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
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ filter: 'drop-shadow(0px 0px 3px rgba(255,255,255,0.12))' }}
          />
          {/* Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: -90 + (clampedPct * 1.8) }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <rect x="0" y="0" width="100" height="100" fill="transparent" pointerEvents="none" />
            <line x1="50" y1="50" x2="50" y2="14" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3" fill="rgba(255,255,255,0.85)" />
          </motion.g>
        </svg>
      </div>

      <div
        className="text-xl font-semibold tracking-tight"
        style={{ fontFamily: OUTFIT, color: getValueColor(value) }}
      >
        {(value > 0 ? "+" : "") + value.toFixed(1)}
      </div>

      <div
        className="mt-0.5 text-[9px] font-medium text-white/75 uppercase tracking-[0.12em] text-center whitespace-nowrap"
        style={{ fontFamily: JAKARTA }}
      >
        {getStatusLabel(value)}
      </div>

      {description && (
        <div className="mt-1 text-[9px] text-white/30 text-center leading-tight px-1" style={{ fontFamily: JAKARTA }}>
          {description}
        </div>
      )}
    </div>
  );
};
