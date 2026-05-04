import { motion } from "framer-motion";
import { type FormData, STEPS } from "@/data/surveySteps";
import { ChevronLeft, Send } from "lucide-react";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface SurveySummaryProps {
  formData: FormData;
  onSubmit: () => void;
  onBack: () => void;
}

export const SurveySummary = ({ formData, onSubmit, onBack }: SurveySummaryProps) => {
  const getDisplayValue = (step: typeof STEPS[0]): string => {
    if (step.type === 'number') {
      const val = formData[step.id];
      return val !== undefined ? `${val} ${step.unit || ''}` : '— Omitido';
    }
    if (step.type === 'scale') {
      const val = formData[step.id] as number;
      if (val === undefined) return '—';
      const opt = step.options?.find(o => o.value === val);
      return opt ? `${val} — ${opt.label}` : `${val}`;
    }
    if (step.type === 'context') return (formData.contexto as string) || 'Normal';
    if (step.type === 'tap') {
      if (formData.tap_total === undefined) return '— Omitido';
      return `${formData.tap_total} taps · var ${formData.tap_variance}ms · ${formData.tap_pauses} pausas`;
    }
    if (step.type === 'ortho') {
      if (formData.hr1 === undefined) return '— Omitido';
      return `HR1:${formData.hr1} HR2:${formData.hr2} HR3:${formData.hr3} HR4:${formData.hr4}`;
    }
    return '—';
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative inline-block mb-1 w-full text-center">
        <div
          className="absolute inset-0 blur-2xl pointer-events-none"
          style={{ background: 'hsla(0,0%,100%,0.14)', transform: 'scale(1.1)' }}
          aria-hidden="true"
        />
        <h2
          className="relative text-[34px] leading-[1.0] text-white"
          style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.025em' }}
        >
          Resumen
        </h2>
      </div>
      <p className="text-[13px] text-white/55 text-center mb-6" style={{ fontFamily: JAKARTA }}>
        Revisá antes de confirmar
      </p>

      {/* Data list */}
      <div
        className="rounded-2xl p-4 mb-6 max-h-[50vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.02) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid hsla(0,0%,100%,0.13)',
          boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.2)',
        }}
      >
        {STEPS.map((step) => (
          <div key={step.id} className="flex justify-between items-start py-2.5 border-b border-white/[0.06] last:border-b-0 gap-3">
            <span
              className="text-[11px] font-semibold tracking-[0.08em] text-white/55 uppercase shrink-0 pt-0.5"
              style={{ fontFamily: JAKARTA }}
            >
              {step.question}
            </span>
            <span className="text-[12px] text-white/80 text-right leading-relaxed" style={{ fontFamily: JAKARTA }}>
              {getDisplayValue(step)}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Atrás"
          className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white/80 hover:text-white"
          style={{
            background: 'linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)',
            border: '1px solid hsla(0,0%,100%,0.2)',
            boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25)',
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <motion.button
          onClick={onSubmit}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 28px hsla(0,0%,0%,0.4)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-black font-semibold"
          style={{
            fontFamily: JAKARTA,
            fontSize: 14,
            background: 'hsla(0,0%,97%,1)',
            boxShadow: '0 6px 20px hsla(0,0%,0%,0.35), 0 2px 6px hsla(0,0%,0%,0.2)',
          }}
        >
          <Send className="h-4 w-4" />
          Guardar
        </motion.button>
      </div>
    </div>
  );
};
