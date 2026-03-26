import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Activity, Utensils } from "lucide-react";
import { DarkLayout } from "@/components/DarkLayout";

const Index = () => {
  const navigate = useNavigate();

  return (
    <DarkLayout className="flex flex-col items-center justify-center px-5">
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            Training Readiness
            <br />
            Assessment Center
          </h1>
        </motion.div>

        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onClick={() => navigate('/morning')}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4 text-left group hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-muted-foreground/60 group-hover:text-foreground/80 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground/90 mb-0.5">Morning Survey</div>
              <div className="text-xs text-muted-foreground leading-snug">Bienestar matutino. Perfil y recuperación.</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors shrink-0" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onClick={() => navigate('/nutrition')}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4 text-left group hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Utensils className="h-5 w-5 text-muted-foreground/60 group-hover:text-foreground/80 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground/90 mb-0.5">Nutrition</div>
              <div className="text-xs text-muted-foreground leading-snug">Nutrición. Peso, calorías y macros.</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors shrink-0" />
          </motion.button>
        </div>
      </div>
    </DarkLayout>
  );
};

export default Index;
