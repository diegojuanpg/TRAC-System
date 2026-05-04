import { type FormData } from "@/data/surveySteps";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SkipForward } from "lucide-react";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface OrthoStepProps {
  formData: FormData;
  updateFormData: (key: string, value: number) => void;
  onSkipToBW?: () => void;
}

const fields = [
  { id: 'hr1', label: 'HR1', desc: 'Promedio acostado durante 2m.', placeholder: '60' },
  { id: 'hr2', label: 'HR2', desc: 'Valor más alto al pararte', placeholder: '80' },
  { id: 'hr3', label: 'HR3', desc: 'Valor más bajo después del pico', placeholder: '72' },
  { id: 'hr4', label: 'HR4', desc: 'Promedio parado durante 2m.', placeholder: '75' },
];

export const OrthoStep = ({ formData, updateFormData, onSkipToBW }: OrthoStepProps) => {
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => firstRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-md">
      {/* Protocol Box */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 mb-6 w-full text-left"
        style={{
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid hsla(0,0%,100%,0.12)',
          boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.18)',
        }}
      >
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-[3px] h-full rounded-l-2xl"
          style={{ background: 'linear-gradient(to bottom, hsla(0,0%,100%,0.35), hsla(0,0%,100%,0.06))' }}
        />
        <div
          className="text-[11px] font-semibold tracking-[0.22em] text-white/75 uppercase mb-4 pl-3"
          style={{ fontFamily: OUTFIT }}
        >
          Protocolo
        </div>
        <ol className="space-y-3 m-0 p-0 pl-3 list-none">
          {[
            'Acostado por 2 min. Registrar FC promedio (HR1).',
            'Levantarse lento. Registrar FC máxima (HR2).',
            'Tras este pico. Registrar FC mínima (HR3).',
            'Parado por 2 min. Registrar FC promedio (HR4).',
          ].map((text, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="flex items-center justify-center text-white/60 text-[10px] rounded-md w-5 h-5 shrink-0 mt-0.5 font-semibold"
                style={{
                  fontFamily: OUTFIT,
                  background: 'hsla(0,0%,100%,0.1)',
                  border: '1px solid hsla(0,0%,100%,0.16)',
                }}
              >
                {i + 1}
              </span>
              <span className="text-[12px] text-white/60 leading-relaxed pt-0.5" style={{ fontFamily: JAKARTA }}>
                {text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f, i) => (
          <div
            key={f.id}
            className="relative rounded-2xl p-4 text-center transition-all duration-200 focus-within:border-white/30"
            style={{
              background: 'linear-gradient(135deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid hsla(0,0%,100%,0.12)',
              boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.15)',
            }}
          >
            <div className="text-[11px] font-semibold tracking-[0.15em] text-white/80 uppercase mb-1" style={{ fontFamily: OUTFIT }}>
              {f.label}
            </div>
            <div className="text-[10px] text-white/45 leading-snug mb-3 min-h-[28px] flex items-center justify-center px-1" style={{ fontFamily: JAKARTA }}>
              {f.desc}
            </div>
            <input
              ref={i === 0 ? firstRef : undefined}
              type="number"
              inputMode="numeric"
              placeholder={f.placeholder}
              min={30}
              max={220}
              value={formData[f.id] ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) updateFormData(f.id, v);
                else if (e.target.value === '') updateFormData(f.id, NaN);
              }}
              className="w-full bg-transparent border-b border-white/[0.1] pb-2 pt-1 text-center text-3xl text-white/90 outline-none placeholder:text-white/15 focus:border-white/35 transition-colors"
              style={{ fontFamily: OUTFIT, fontWeight: 500, letterSpacing: '-0.02em' }}
            />
            <div className="text-[9px] tracking-[0.18em] text-white/35 mt-2 uppercase" style={{ fontFamily: JAKARTA }}>
              BPM
            </div>
          </div>
        ))}
      </div>

      {/* Skip button */}
      {onSkipToBW && (
        <motion.button
          onClick={onSkipToBW}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mt-5 w-full relative flex items-center justify-center gap-2.5 rounded-full overflow-hidden"
          style={{
            fontFamily: JAKARTA,
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: '0.01em',
            padding: '11px 20px',
            color: 'hsla(0,0%,100%,0.65)',
            background: 'hsla(0,0%,100%,0.05)',
            border: '1px solid hsla(0,0%,100%,0.14)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <SkipForward className="w-3.5 h-3.5" />
          Saltar mediciones → ir a peso
        </motion.button>
      )}
    </div>
  );
};
