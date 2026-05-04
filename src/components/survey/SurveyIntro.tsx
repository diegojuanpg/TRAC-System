import { motion } from "framer-motion";
import { ArrowRight, Sun } from "lucide-react";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface SurveyIntroProps {
  onStart: () => void;
  totalSteps: number;
}

export const SurveyIntro = ({ onStart, totalSteps }: SurveyIntroProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm sm:max-w-md"
    >
      <div
        className="relative overflow-hidden rounded-[28px] flex flex-col"
        style={{
          padding: '28px 32px 32px',
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.14) 0%, hsla(0,0%,100%,0.04) 55%, hsla(0,0%,100%,0.09) 100%)',
          backdropFilter: 'blur(44px) saturate(170%)',
          WebkitBackdropFilter: 'blur(44px) saturate(170%)',
          border: '1px solid hsla(0,0%,100%,0.2)',
          boxShadow: '0 24px 70px -10px hsla(0,0%,0%,0.6), inset 0 1px 0 hsla(0,0%,100%,0.3), inset 0 0 0 1px hsla(0,0%,100%,0.06)',
        }}
      >
        {/* Top sheen */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.55), transparent)' }}
        />
        {/* Inner radial sheen */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 85% 45% at 50% 0%, hsla(0,0%,100%,0.14) 0%, transparent 62%)' }}
        />

        {/* Label row */}
        <div className="flex items-center justify-between mb-7 relative">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase" style={{ fontFamily: JAKARTA }}>
            Morning Survey
          </span>
          <span className="text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase" style={{ fontFamily: JAKARTA }}>
            TRAC
          </span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4 relative">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.05) 100%)',
              border: '1px solid hsla(0,0%,100%,0.22)',
              boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.3)',
            }}
          >
            <Sun className="w-5 h-5 text-white/85" />
          </div>
        </div>

        {/* Title */}
        <div className="relative inline-block mb-2 text-center">
          <div
            className="absolute inset-0 blur-2xl pointer-events-none"
            style={{ background: 'hsla(0,0%,100%,0.16)', transform: 'scale(1.2)' }}
            aria-hidden="true"
          />
          <h1
            className="relative text-[36px] leading-[1.05] text-white text-center"
            style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.025em' }}
          >
            Bienestar matinal
          </h1>
        </div>

        {/* Description */}
        <p
          className="text-[13px] text-white/60 leading-relaxed text-center mb-5"
          style={{ fontFamily: JAKARTA }}
        >
          Evalúa la respuesta de tu cuerpo al entrenamiento mediante preguntas subjetivas y métricas objetivas.
        </p>

        {/* Info note */}
        <div
          className="relative rounded-xl p-3.5 mb-7"
          style={{
            background: 'hsla(0,0%,100%,0.05)',
            border: '1px solid hsla(0,0%,100%,0.12)',
          }}
        >
          <p className="text-[11px] text-white/55 leading-relaxed" style={{ fontFamily: JAKARTA }}>
            <span className="font-semibold text-white/75 block mb-1 uppercase tracking-[0.12em] text-[10px]">
              Aviso de precisión
            </span>
            La sección objetiva es opcional, pero omitirla reduce la precisión al predecir fatiga y readiness.
          </p>
        </div>

        {/* CTA */}
        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative w-full flex items-center justify-center gap-2 rounded-full text-white overflow-hidden group"
          style={{
            fontFamily: JAKARTA,
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: '0.01em',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1.5px solid hsla(0,0%,100%,0.4)',
            boxShadow: '0 6px 18px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.35)',
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-4 top-0 h-px opacity-70"
            style={{ background: 'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.7), transparent)' }}
          />
          Comenzar
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </motion.button>

      </div>
    </motion.div>
  );
};
