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
  cut: "Déficit",
  maintenance: "Mantenimiento",
  bulk: "Superávit",
};
const modeColor: Record<string, string> = {
  cut: "#93c5fd",
  maintenance: "#6ee7a0",
  bulk: "#fcd34d",
};

const ACC = {
  protein: "#6ee7a0",
  carbs:   "#93c5fd",
  fat:     "#fcd34d",
};

interface KpiProps {
  label: string;
  value: string;
  unit: string;
}

const Kpi = ({ label, value, unit }: KpiProps) => (
  <div className="flex flex-col gap-1 min-w-0">
    <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] uppercase text-white/45"
      style={{ fontFamily: JAKARTA }}>
      {label}
    </span>
    <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0">
      <span className="text-[24px] sm:text-[32px] leading-[0.95] font-semibold tabular-nums text-white truncate"
        style={{ fontFamily: OUTFIT, letterSpacing: "-0.04em" }}>
        {value}
      </span>
      <span className="text-[10px] sm:text-[12px] font-normal text-white/35 shrink-0" style={{ fontFamily: JAKARTA }}>
        {unit}
      </span>
    </div>
  </div>
);

interface MacroCardProps {
  accent: string;
  label: string;
  short: string;
  grams: number | null;
  pct: number | null;
  kcal: number | null;
  gPerKg: number | null;
}

const MacroCard = ({ accent, label, short, grams, pct, kcal, gPerKg }: MacroCardProps) => (
  <div
    className="relative rounded-xl p-2.5 sm:p-3 flex flex-col gap-1 overflow-hidden"
    style={{
      background: `linear-gradient(160deg, ${accent}20 0%, ${accent}0a 100%)`,
      border: `1px solid ${accent}28`,
    }}
  >
    <div aria-hidden className="absolute inset-x-0 top-0 h-[1.5px]"
      style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }} />
    <div aria-hidden className="absolute -top-5 -left-2 w-14 h-14 rounded-full pointer-events-none"
      style={{ background: `${accent}18`, filter: "blur(14px)" }} />

    <div className="relative flex items-center gap-1 min-w-0">
      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: accent, boxShadow: `0 0 5px ${accent}` }} />
      <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.1em] uppercase truncate"
        style={{ fontFamily: JAKARTA, color: `${accent}c0` }}>
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{short}</span>
      </span>
    </div>

    <div className="relative flex items-baseline gap-0.5 min-w-0">
      <span className="text-[20px] sm:text-[24px] leading-none font-semibold tabular-nums"
        style={{ fontFamily: OUTFIT, letterSpacing: "-0.025em", color: accent }}>
        {grams ?? "—"}
      </span>
      {grams != null && (
        <span className="text-[9px] sm:text-[10px] font-normal" style={{ color: `${accent}70`, fontFamily: JAKARTA }}>g</span>
      )}
    </div>

    {(pct != null || kcal != null || gPerKg != null) && (
      <div className="relative flex flex-wrap gap-x-1 text-[8px] sm:text-[9px] font-medium tabular-nums"
        style={{ color: `${accent}80`, fontFamily: JAKARTA }}>
        {pct != null && <span>{pct}%</span>}
        {kcal != null && <><span style={{ color: `${accent}40` }}>·</span><span>{kcal.toLocaleString("en-US")}k</span></>}
        {gPerKg != null && <><span style={{ color: `${accent}40` }}>·</span><span>{gPerKg}/kg</span></>}
      </div>
    )}
  </div>
);

interface Props {
  goals: Goals;
  onEditClick: () => void;
  currentWeight?: number | null;
}

export const PrescriptionCard = ({ goals, onEditClick, currentWeight }: Props) => {
  const mc = modeColor[goals.mode] ?? "#6ee7a0";
  const kcalFmt  = goals.kcalTarget  != null ? goals.kcalTarget.toLocaleString("en-US")  : "—";
  const stepsFmt = goals.stepsTarget != null ? goals.stepsTarget.toLocaleString("en-US") : "—";

  const totalKcal = goals.kcalTarget;

  const proteinKcal = goals.proteinTarget != null ? Math.round(goals.proteinTarget * 4) : null;
  const carbsKcal   = goals.carbsTarget   != null ? Math.round(goals.carbsTarget   * 4) : null;
  const fatKcal     = goals.fatTarget     != null ? Math.round(goals.fatTarget      * 9) : null;

  const w = currentWeight ?? null;
  const proteinGpkg = (goals.proteinTarget != null && w) ? parseFloat((goals.proteinTarget / w).toFixed(1)) : null;
  const carbsGpkg   = (goals.carbsTarget   != null && w) ? parseFloat((goals.carbsTarget   / w).toFixed(1)) : null;
  const fatGpkg     = (goals.fatTarget     != null && w) ? parseFloat((goals.fatTarget      / w).toFixed(1)) : null;

  const proteinPct = (proteinKcal != null && totalKcal) ? Math.round(proteinKcal / totalKcal * 100) : null;
  const carbsPct   = (carbsKcal   != null && totalKcal) ? Math.round(carbsKcal   / totalKcal * 100) : null;
  const fatPct     = (fatKcal     != null && totalKcal) ? Math.round(fatKcal     / totalKcal * 100) : null;

  const haveBar = proteinPct != null && carbsPct != null && fatPct != null;

  return (
    <div className="relative rounded-xl px-3 pt-3 pb-2.5 sm:px-4 sm:pt-4 sm:pb-3 overflow-hidden" style={glass}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.35), transparent)" }} />

      {/* Edit button — absolute top-left */}
      <button
        onClick={onEditClick}
        aria-label="Editar"
        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/50 hover:text-white active:text-white transition-colors"
        style={{ fontFamily: JAKARTA, background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)" }}
      >
        <Settings2 className="w-3 h-3" />
        Editar
      </button>

      {/* Mode badge row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2 pr-20 sm:pr-24">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ fontFamily: JAKARTA, color: mc, background: `${mc}14`, border: `1px solid ${mc}28` }}>
          {modeLabel[goals.mode] ?? "Mantenimiento"}
        </span>
        {goals.targetWeight != null && (
          <span className="text-[10px] text-white/35" style={{ fontFamily: JAKARTA }}>
            {goals.targetWeight}kg
            {goals.targetRatePerWeek != null && (
              <span className="text-white/25 ml-0.5">
                ({goals.targetRatePerWeek > 0 ? "+" : ""}{goals.targetRatePerWeek}/sem)
              </span>
            )}
          </span>
        )}
      </div>

      {/* KPIs row — both columns aligned */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 relative mb-2 sm:mb-3">
        <Kpi label="Calorías"  value={kcalFmt}  unit="Kcal" />

        <div aria-hidden className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
          style={{ background: "linear-gradient(180deg, transparent, hsla(0,0%,100%,0.1) 30%, hsla(0,0%,100%,0.1) 70%, transparent)" }} />

        <div className="pl-2.5 sm:pl-4 min-w-0">
          <Kpi label="Actividad" value={stepsFmt} unit="Pasos" />
        </div>
      </div>

      {/* Macro distribution chart */}
      {haveBar && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-white/40"
              style={{ fontFamily: JAKARTA }}>
              Macros
            </span>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] text-white/40"
              style={{ fontFamily: JAKARTA }}>
              {goals.fiberTarget != null && (
                <span>
                  Fibra <span className="text-white/75 font-semibold tabular-nums">{goals.fiberTarget}</span>
                  <span className="text-white/25 ml-0.5">g</span>
                </span>
              )}
              {goals.waterTarget != null && (
                <span>
                  Agua <span className="text-white/75 font-semibold tabular-nums">{goals.waterTarget}</span>
                  <span className="text-white/25 ml-0.5">lt</span>
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MacroCard accent={ACC.carbs}   label="Carbohidratos" short="Carb" grams={goals.carbsTarget}   pct={carbsPct}   kcal={carbsKcal}   gPerKg={carbsGpkg} />
            <MacroCard accent={ACC.fat}     label="Grasas"        short="Gras" grams={goals.fatTarget}     pct={fatPct}     kcal={fatKcal}     gPerKg={fatGpkg} />
            <MacroCard accent={ACC.protein} label="Proteína"      short="Prot" grams={goals.proteinTarget} pct={proteinPct} kcal={proteinKcal} gPerKg={proteinGpkg} />
          </div>
        </div>
      )}

    </div>
  );
};
