import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight, Sun } from "lucide-react";

interface SurveyIntroProps {
  onStart: () => void;
  totalSteps: number;
}

export const SurveyIntro = ({ onStart, totalSteps }: SurveyIntroProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-sm sm:max-w-md"
    >
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[24px] p-6 sm:p-8 flex flex-col relative overflow-hidden backdrop-blur-md shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center gap-4 mb-8 relative z-10 text-center">
          <div className="relative w-14 h-14 bg-gradient-to-b from-amber-500/20 to-orange-500/5 border border-amber-500/20 rounded-[18px] flex items-center justify-center shadow-[inset_0_0_20px_rgba(245,158,11,0.1)] shrink-0 mb-1">
            <Sun className="w-7 h-7 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white m-0">
            Morning Survey
          </h1>
        </div>

        <div className="mb-8 relative z-10 flex flex-col items-center">
          <p className="text-[13px] sm:text-sm text-white/50 leading-relaxed font-light mb-6 text-center max-w-[280px] sm:max-w-none">
            Este cuestionario evalúa la respuesta de tu cuerpo al entrenamiento. Se compone de preguntas subjetivas y métricas objetivas.
          </p>
          
          <div className="bg-amber-500/[0.05] border border-amber-500/10 rounded-xl p-3.5 flex gap-3 items-start text-left w-full">
             <Info className="w-4 h-4 text-amber-500/60 shrink-0 mt-[1px]" />
             <p className="text-[11px] sm:text-xs text-amber-500/70 leading-relaxed m-0 pr-2">
               <span className="font-semibold tracking-wide uppercase text-amber-500/80 block mb-1">Aviso de Precisión</span>
               Aunque la sección de métricas objetivas es opcional, omitirla reducirá significativamente la precisión del sistema al predecir fatiga y readiness.
             </p>
          </div>
        </div>

        <button 
          onClick={onStart} 
          className="relative z-10 group w-full h-12 sm:h-14 flex items-center justify-center gap-2 rounded-xl bg-white text-black transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
        >
          <span className="font-mono text-[11px] sm:text-[12px] tracking-[0.1em] uppercase font-bold">Comenzar Test</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
};
