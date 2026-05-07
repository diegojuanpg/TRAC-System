import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Zap, Target, Activity, CheckCircle } from "lucide-react";
import {
  NutritionRow,
  Goals,
  MaintenanceResult,
  WeekDelta,
  GoalProjection,
  filterByRange,
  adherence,
  todayLocalISO,
} from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const glass = {
  background: "linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)",
  backdropFilter: "blur(30px) saturate(160%)",
  WebkitBackdropFilter: "blur(30px) saturate(160%)",
  border: "1px solid hsla(0,0%,100%,0.16)",
  boxShadow: "0 8px 24px hsla(0,0%,0%,0.35), inset 0 1px 0 hsla(0,0%,100%,0.28)",
} as const;

interface KPICardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  accent?: string;
}

const KPICard = ({ label, value, sub, icon, accent = "text-white" }: KPICardProps) => (
  <div className="relative rounded-2xl p-4 flex flex-col gap-1 min-w-0" style={glass}>
    <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.4), transparent)" }} />
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-semibold tracking-[0.16em] text-white/50 uppercase" style={{ fontFamily: JAKARTA }}>{label}</span>
      <span className="text-white/35">{icon}</span>
    </div>
    <div className={`text-[28px] leading-none font-semibold ${accent} tabular-nums`} style={{ fontFamily: OUTFIT, letterSpacing: "-0.02em" }}>
      {value}
    </div>
    {sub && <div className="text-[11px] text-white/50 mt-0.5" style={{ fontFamily: JAKARTA }}>{sub}</div>}
  </div>
);

const confidenceColor: Record<string, string> = {
  high: "text-[#6ee7a0]",
  medium: "text-[#fcd34d]",
  low: "text-[#fdba74]",
  insufficient: "text-white/35",
};

const paceColor: Record<string, string> = {
  on_track: "text-[#6ee7a0]",
  fast: "text-[#fcd34d]",
  slow: "text-[#fdba74]",
  wrong_direction: "text-[#fca5a5]",
  unknown: "text-white/35",
};

const paceLabel: Record<string, string> = {
  on_track: "En ritmo",
  fast: "Ritmo rápido",
  slow: "Ritmo lento",
  wrong_direction: "Dirección opuesta",
  unknown: "Sin datos",
};

interface Props {
  rows: NutritionRow[];
  goals: Goals;
  maintenance: MaintenanceResult;
  weekDelta: WeekDelta;
  projection: GoalProjection;
  rangeDays: number;
}

export const NutritionKPIs = ({ rows, goals, maintenance, weekDelta, projection, rangeDays }: Props) => {
  const adh = useMemo(() => adherence(rows, rangeDays), [rows, rangeDays]);
  const rangeRows = useMemo(() => filterByRange(rows, rangeDays), [rows, rangeDays]);

  const avgKcal = useMemo(() => {
    const cals = rangeRows.map(r => r.calories).filter((v): v is number => v !== null);
    return cals.length ? Math.round(cals.reduce((a, b) => a + b, 0) / cals.length) : null;
  }, [rangeRows]);

  const avgProtein = useMemo(() => {
    const vals = rangeRows.map(r => r.protein).filter((v): v is number => v !== null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }, [rangeRows]);

  const latestWeight = useMemo(() => {
    const with_bw = rows.filter(r => r.bodyweight !== null);
    return with_bw.length ? with_bw[with_bw.length - 1].bodyweight : null;
  }, [rows]);

  const deltaSign = (weekDelta.deltaKg ?? 0) > 0.05 ? "+" : (weekDelta.deltaKg ?? 0) < -0.05 ? "-" : "=";
  const DeltaIcon = deltaSign === "+" ? TrendingUp : deltaSign === "-" ? TrendingDown : Minus;
  const deltaColor = goals.mode === "cut"
    ? (deltaSign === "-" ? "text-[#6ee7a0]" : deltaSign === "+" ? "text-[#fca5a5]" : "text-white/60")
    : goals.mode === "bulk"
    ? (deltaSign === "+" ? "text-[#6ee7a0]" : deltaSign === "-" ? "text-[#fca5a5]" : "text-white/60")
    : "text-white/60";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {/* Maintenance kcal */}
      <KPICard
        label="Mantenimiento"
        icon={<Zap className="w-4 h-4" />}
        value={maintenance.maintenance != null ? maintenance.maintenance.toLocaleString() : "—"}
        sub={
          maintenance.maintenance != null ? (
            <span className={confidenceColor[maintenance.confidence]}>
              {maintenance.confidence === "high" ? "Alta confianza" :
               maintenance.confidence === "medium" ? "Confianza media" :
               maintenance.confidence === "low" ? "Baja confianza" : "Datos insuficientes"}
            </span>
          ) : "≥ 10 días con datos"
        }
        accent={maintenance.maintenance != null ? "text-white" : "text-white/35"}
      />

      {/* Peso actual + delta */}
      <KPICard
        label="Peso actual"
        icon={<DeltaIcon className={`w-4 h-4 ${deltaColor}`} />}
        value={latestWeight != null ? `${latestWeight.toFixed(1)}` : "—"}
        sub={
          weekDelta.deltaGr != null ? (
            <span className={deltaColor}>
              {deltaSign}{Math.abs(weekDelta.deltaGr)}g vs sem. pasada
            </span>
          ) : "Sin datos semana pasada"
        }
        accent="text-white"
      />

      {/* Avg kcal */}
      <KPICard
        label={`Kcal avg ${rangeDays}d`}
        icon={<Activity className="w-4 h-4" />}
        value={avgKcal != null ? avgKcal.toLocaleString() : "—"}
        sub={
          goals.kcalTarget != null && avgKcal != null ? (
            <span className={
              avgKcal > goals.kcalTarget * 1.1 ? "text-[#fca5a5]" :
              avgKcal < goals.kcalTarget * 0.9 ? "text-[#fdba74]" :
              "text-[#6ee7a0]"
            }>
              Target: {goals.kcalTarget.toLocaleString()} kcal
            </span>
          ) : goals.kcalTarget != null ? `Target: ${goals.kcalTarget.toLocaleString()} kcal` : "Sin target"
        }
        accent="text-white"
      />

      {/* Proteína avg */}
      <KPICard
        label={`Proteína avg ${rangeDays}d`}
        icon={<Activity className="w-4 h-4" />}
        value={avgProtein != null ? `${avgProtein}g` : "—"}
        sub={
          goals.proteinTarget != null && avgProtein != null ? (
            <span className={
              avgProtein >= goals.proteinTarget * 0.95 ? "text-[#6ee7a0]" :
              avgProtein >= goals.proteinTarget * 0.80 ? "text-[#fcd34d]" :
              "text-[#fca5a5]"
            }>
              Target: {goals.proteinTarget}g
            </span>
          ) : goals.proteinTarget != null ? `Target: ${goals.proteinTarget}g` : "Sin target"
        }
        accent="text-white"
      />

      {/* Adherencia */}
      <KPICard
        label={`Adherencia ${rangeDays}d`}
        icon={<CheckCircle className="w-4 h-4" />}
        value={`${Math.round(adh.pctComplete)}%`}
        sub={<span>{adh.full} completos · {adh.partial} parciales</span>}
        accent={adh.pctComplete >= 80 ? "text-[#6ee7a0]" : adh.pctComplete >= 50 ? "text-[#fcd34d]" : "text-[#fca5a5]"}
      />

      {/* Objetivo / proyección */}
      <KPICard
        label="Proyección objetivo"
        icon={<Target className="w-4 h-4" />}
        value={
          projection.estimatedDate
            ? new Date(projection.estimatedDate + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })
            : goals.targetWeight != null
            ? `→ ${goals.targetWeight}kg`
            : "—"
        }
        sub={
          projection.paceVsPlan !== "unknown" ? (
            <span className={paceColor[projection.paceVsPlan]}>
              {paceLabel[projection.paceVsPlan]}
            </span>
          ) : "Configura objetivo"
        }
        accent={projection.estimatedDate ? "text-white" : "text-white/35"}
      />
    </div>
  );
};
