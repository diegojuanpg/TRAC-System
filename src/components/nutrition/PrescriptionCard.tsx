import { Settings2 } from "lucide-react";
import { Goals } from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const glass = {
  background: "linear-gradient(135deg, hsla(0,0%,100%,0.09) 0%, hsla(0,0%,100%,0.03) 100%)",
  backdropFilter: "blur(30px) saturate(160%)",
  WebkitBackdropFilter: "blur(30px) saturate(160%)",
  border: "1px solid hsla(0,0%,100%,0.13)",
  boxShadow: "0 6px 20px hsla(0,0%,0%,0.28), inset 0 1px 0 hsla(0,0%,100%,0.22)",
} as const;

const modeLabel: Record<string, string> = {
  cut: "Bajada",
  maintenance: "Mantenimiento",
  bulk: "Subida",
};
const modeColor: Record<string, string> = {
  cut: "#93c5fd",
  maintenance: "#6ee7a0",
  bulk: "#fcd34d",
};

interface MetricProps {
  label: string;
  value: string | number | null;
  unit?: string;
  color?: string;
}

const Metric = ({ label, value, unit, color }: MetricProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-white/40" style={{ fontFamily: JAKARTA }}>
      {label}
    </span>
    <span
      className="text-[28px] leading-none font-semibold tabular-nums"
      style={{ fontFamily: OUTFIT, letterSpacing: "-0.02em", color: color ?? "rgba(255,255,255,0.85)" }}
    >
      {value != null ? value : "—"}
      {value != null && unit ? (
        <span className="text-[14px] font-normal text-white/40 ml-0.5">{unit}</span>
      ) : null}
    </span>
  </div>
);

interface Props {
  goals: Goals;
  onEditClick: () => void;
}

export const PrescriptionCard = ({ goals, onEditClick }: Props) => {
  const mc = modeColor[goals.mode] ?? "#6ee7a0";

  return (
    <div className="relative rounded-2xl p-5" style={glass}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.35), transparent)" }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase mb-0.5" style={{ fontFamily: JAKARTA }}>
            Prescripción del coach
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ fontFamily: JAKARTA, color: mc }}>
              {modeLabel[goals.mode] ?? "Mantenimiento"}
            </span>
            {goals.targetWeight != null && (
              <>
                <span className="text-white/25 text-[11px]">·</span>
                <span className="text-[12px] text-white/55" style={{ fontFamily: JAKARTA }}>
                  Objetivo: {goals.targetWeight} kg
                </span>
              </>
            )}
            {goals.targetRatePerWeek != null && (
              <>
                <span className="text-white/25 text-[11px]">·</span>
                <span className="text-[12px] text-white/55" style={{ fontFamily: JAKARTA }}>
                  {goals.targetRatePerWeek > 0 ? "+" : ""}{goals.targetRatePerWeek} kg/sem
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onEditClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold text-white/60 hover:text-white transition-colors"
          style={{ fontFamily: JAKARTA, background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)" }}
        >
          <Settings2 className="w-3 h-3" />
          Editar
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
        <Metric label="Calorías" value={goals.kcalTarget != null ? goals.kcalTarget.toLocaleString('en-US') : null} unit="kcal" color={mc} />
        <Metric label="Proteína" value={goals.proteinTarget} unit="g" />
        <Metric label="Carbs" value={goals.carbsTarget} unit="g" />
        <Metric label="Grasa" value={goals.fatTarget} unit="g" />
        <Metric label="Fibra" value={goals.fiberTarget} unit="g" />
        <Metric label="Agua" value={goals.waterTarget} unit="lt" />
        <Metric label="Pasos" value={goals.stepsTarget != null ? goals.stepsTarget.toLocaleString('en-US') : null} />
      </div>
    </div>
  );
};
