import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { GoalsPanel } from "./GoalsPanel";
import { Goals, NutritionRow } from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

interface Props {
  open: boolean;
  goals: Goals;
  currentWeight: number | null;
  maintenanceKcal: number | null;
  rows: NutritionRow[];
  onSave: (g: Goals) => void;
  onClose: () => void;
  saveContext?: { athleteId: string | null };
  prescribedBy?: string;
}

export const GoalsModal = ({ open, goals, currentWeight, maintenanceKcal, rows, onSave, onClose, saveContext, prescribedBy }: Props) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
          style={{ background: "hsla(0,0%,0%,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-4 top-6 bottom-6 z-50 max-w-5xl mx-auto overflow-y-auto"
          style={{ borderRadius: 28 }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="relative min-h-full p-6"
            style={{
              background: "linear-gradient(135deg, hsla(0,0%,100%,0.13) 0%, hsla(0,0%,100%,0.05) 55%, hsla(0,0%,100%,0.09) 100%)",
              backdropFilter: "blur(44px) saturate(170%)",
              WebkitBackdropFilter: "blur(44px) saturate(170%)",
              border: "1px solid hsla(0,0%,100%,0.2)",
              boxShadow: "0 24px 70px -10px hsla(0,0%,0%,0.7), inset 0 1px 0 hsla(0,0%,100%,0.3)",
              borderRadius: 28,
            }}
          >
            <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.55), transparent)", borderRadius: "28px 28px 0 0" }} />

            <div className="flex items-center justify-between mb-5">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-white/50 uppercase" style={{ fontFamily: JAKARTA }}>
                Goals & Targets
              </p>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/45 hover:text-white transition-colors"
                style={{ background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <GoalsPanel
              goals={goals}
              currentWeight={currentWeight}
              maintenanceKcal={maintenanceKcal}
              rows={rows}
              onSave={(g) => { onSave(g); onClose(); }}
              saveContext={saveContext}
              prescribedBy={prescribedBy}
            />
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
