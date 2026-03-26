import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
      className="w-full max-w-sm"
    >
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
        <div className="text-4xl mb-6">☀️</div>

        <h1 className="text-3xl font-semibold text-foreground/90 tracking-tight mb-3">
          Morning Survey
        </h1>
        <p className="text-sm text-muted-foreground/50 leading-relaxed mb-8 my-0 pt-[2px]">
          Este test consta de {totalSteps} preguntas y te tomará aproximadamente 4 minutos completarlo.
        </p>

        <Button variant="nav" size="full" onClick={onStart} className="w-full">
          <span className="font-mono text-xs tracking-[0.06em] uppercase">Comenzar</span>
        </Button>
      </div>
    </motion.div>
  );
};
