import { motion } from "framer-motion";
import { Check } from "lucide-react";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface SurveySuccessProps {
  onClose: () => void;
}

export const SurveySuccess = ({ onClose }: SurveySuccessProps) => {
  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="text-center max-w-sm w-full"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.14) 0%, hsla(0,0%,100%,0.05) 100%)',
          border: '1px solid hsla(0,0%,100%,0.22)',
          boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.3), 0 8px 24px hsla(0,0%,0%,0.3)',
        }}
      >
        <Check className="h-7 w-7 text-white/85" />
      </div>

      <div className="relative inline-block mb-2">
        <div
          className="absolute inset-0 blur-2xl pointer-events-none"
          style={{ background: 'hsla(0,0%,100%,0.16)', transform: 'scale(1.2)' }}
          aria-hidden="true"
        />
        <h2
          className="relative text-[38px] leading-[1.0] text-white"
          style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.025em' }}
        >
          Registrado.
        </h2>
      </div>

      <p className="text-[13px] text-white/60 mb-2 leading-relaxed" style={{ fontFamily: JAKARTA }}>
        Tus datos fueron guardados<br />en la base de datos.
      </p>
      <p className="text-[10px] text-white/35 tracking-[0.12em] uppercase mb-8" style={{ fontFamily: JAKARTA }}>
        {today}
      </p>

      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative w-full max-w-xs mx-auto flex items-center justify-center rounded-full text-white overflow-hidden"
        style={{
          fontFamily: JAKARTA, fontWeight: 600, fontSize: 14,
          padding: '14px 24px',
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1.5px solid hsla(0,0%,100%,0.4)',
          boxShadow: '0 6px 18px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.35)',
        }}
      >
        <span aria-hidden="true" className="absolute inset-x-4 top-0 h-px opacity-70"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.7), transparent)' }} />
        Volver al inicio
      </motion.button>
    </motion.div>
  );
};
