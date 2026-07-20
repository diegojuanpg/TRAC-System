import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, RefreshCw, Table2, Utensils } from "lucide-react";
import {
  Line, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart,
} from "recharts";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";
import { useNutritionData } from "@/hooks/useNutritionData";
import { PrescriptionCard } from "@/components/nutrition/PrescriptionCard";
import { AdherenceCalendar } from "@/components/nutrition/AdherenceCalendar";
import { GoalsModal } from "@/components/nutrition/GoalsModal";
import { AddEntryModal } from "@/components/nutrition/AddEntryModal";
import { WeightDataTablesModal } from "@/components/nutrition/WeightDataTablesModal";
import {
  Goals, filterByRange, estimateMaintenance,
  rollingMean, weeklyAggregates,
} from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const glassPanel = {
  background: "linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.03) 100%)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid hsla(0,0%,100%,0.12)",
  boxShadow: "0 6px 20px hsla(0,0%,0%,0.28), inset 0 1px 0 hsla(0,0%,100%,0.2)",
} as const;

const glassKpi = {
  background: "linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)",
  backdropFilter: "blur(30px) saturate(160%)",
  WebkitBackdropFilter: "blur(30px) saturate(160%)",
  border: "1px solid hsla(0,0%,100%,0.16)",
  boxShadow: "0 8px 24px hsla(0,0%,0%,0.32), inset 0 1px 0 hsla(0,0%,100%,0.28)",
} as const;

const axisStyle = { fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: JAKARTA };

const RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
  { label: "6m", days: 180 },
  { label: "1a", days: 365 },
];

const RangeToggle = ({ value, onChange, options = RANGES }: {
  value: number;
  onChange: (d: number) => void;
  options?: typeof RANGES;
}) => (
  <div className="flex gap-0.5">
    {options.map(r => (
      <button
        key={r.days}
        onClick={() => onChange(r.days)}
        className="px-2 py-1.5 rounded-full text-[9px] font-semibold tracking-[0.08em] transition-all min-h-[32px] min-w-[28px]"
        style={{
          fontFamily: JAKARTA,
          color: value === r.days ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
          background: value === r.days ? "hsla(0,0%,100%,0.13)" : "transparent",
          border: "1px solid " + (value === r.days ? "hsla(0,0%,100%,0.2)" : "transparent"),
        }}
      >
        {r.label}
      </button>
    ))}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-[11px]" style={{ background: "hsla(0,0%,8%,0.92)", border: "1px solid hsla(0,0%,100%,0.16)", backdropFilter: "blur(20px)", fontFamily: JAKARTA, color: "rgba(255,255,255,0.8)" }}>
      <div className="font-semibold mb-1 text-white/50">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? "rgba(255,255,255,0.75)" }}>
          {p.name}: {typeof p.value === "number" ? p.value : p.value}
        </div>
      ))}
    </div>
  );
};

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-4">
    <h2 className="text-[22px] font-semibold text-white leading-none" style={{ fontFamily: OUTFIT, letterSpacing: "-0.025em" }}>{title}</h2>
    {sub && <p className="text-[11px] text-white/40 mt-0.5" style={{ fontFamily: JAKARTA }}>{sub}</p>}
  </div>
);

const Divider = () => (
  <div className="w-full h-px my-2" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.1), transparent)" }} />
);

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const ChartCard = ({ title, range, onRange, children, rangeOptions, action }: {
  title: string;
  range: number;
  onRange: (d: number) => void;
  children: React.ReactNode;
  rangeOptions?: typeof RANGES;
  action?: React.ReactNode;
}) => (
  <div className="relative rounded-2xl p-4 pb-3" style={glassPanel}>
    <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.28), transparent)" }} />
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase truncate" style={{ fontFamily: JAKARTA }}>{title}</p>
        {action}
      </div>
      <RangeToggle value={range} onChange={onRange} options={rangeOptions} />
    </div>
    {children}
  </div>
);

interface Props {
  athleteOverride?: { athleteId: string; athleteName: string; email: string };
  onBack?: () => void;
}

export default function NutritionDashboard({ athleteOverride, onBack }: Props) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { rows, goals, refeeds, loading, error, refetch, setState, effectiveCtx } = useNutritionData(
    athleteOverride ? { athleteId: athleteOverride.athleteId } : undefined
  );
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [weightTablesOpen, setWeightTablesOpen] = useState(false);

  // Per-chart range state
  const [bwRange, setBwRange] = useState(60);
  const [weeklyRange, setWeeklyRange] = useState(90);
  const [macrosRange, setMacrosRange] = useState(30);
  const [actRange, setActRange] = useState(30);

  if (!user) return null;

  const maintenance = useMemo(() => estimateMaintenance(rows, 21), [rows]);

  const latestWeight = useMemo(() => {
    const w = rows.filter(r => r.bodyweight !== null);
    return w.length ? w[w.length - 1].bodyweight : null;
  }, [rows]);

  const kcalAvg14 = useMemo(() => {
    const cals = filterByRange(rows, 14).map(r => r.calories).filter((v): v is number => v !== null);
    return cals.length ? Math.round(cals.reduce((a, b) => a + b, 0) / cals.length) : null;
  }, [rows]);

  const bwData = useMemo(() => {
    const r = filterByRange(rows, bwRange);
    const ma7 = rollingMean(r.map(x => x.bodyweight), 7);
    return r.map((x, i) => ({
      date: fmtDate(x.date),
      Peso: x.bodyweight,
      MA7: ma7[i] != null ? parseFloat((ma7[i] as number).toFixed(2)) : null,
    }));
  }, [rows, bwRange]);

  const weeklyData = useMemo(() => {
    return weeklyAggregates(filterByRange(rows, weeklyRange)).map(w => ({
      week: fmtDate(w.weekStart),
      "Peso prom": w.avgWeight != null ? parseFloat(w.avgWeight.toFixed(2)) : null,
      "Kcal prom": w.avgCals != null ? Math.round(w.avgCals) : null,
    }));
  }, [rows, weeklyRange]);

  const macrosData = useMemo(() => filterByRange(rows, macrosRange).map(r => ({
    date: fmtDate(r.date),
    "Proteína": r.protein,
    "Carbs": r.carbs,
    "Grasa": r.fat,
    "Fibra": r.fiber,
  })), [rows, macrosRange]);

  const actData = useMemo(() => filterByRange(rows, actRange).map(r => ({
    date: fmtDate(r.date),
    "Pasos": r.steps,
    "Cardio (min)": r.cardio != null ? (typeof r.cardio === "string" ? parseFloat(r.cardio) || 0 : r.cardio) : 0,
  })), [rows, actRange]);

  const handleGoalsSave = (g: Goals) => setState(s => ({ ...s, goals: g }));

  return (
    <DarkLayout>
      {/* Back */}
      <div className="fixed left-4 z-40" style={{ top: 'max(1.25rem, env(safe-area-inset-top, 1.25rem))' }}>
        <button
          onClick={onBack ?? (() => navigate("/"))}
          className="flex items-center justify-center w-10 h-10 rounded-full text-white/65 hover:text-white transition-colors"
          style={{ background: "linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", border: "1px solid hsla(0,0%,100%,0.18)", boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.25)" }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Top-right */}
      <div className="fixed right-4 z-40 flex items-center gap-2" style={{ top: 'max(1.25rem, env(safe-area-inset-top, 1.25rem))' }}>
        <button
          onClick={refetch}
          disabled={loading}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/45 hover:text-white transition-colors"
          style={{ background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)" }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
        <motion.button
          onClick={() => setEntryOpen(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-[12px] font-semibold"
          style={{ fontFamily: JAKARTA, background: "linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", border: "1.5px solid hsla(0,0%,100%,0.35)", boxShadow: "0 4px 14px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.3)", letterSpacing: "0.02em" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo registro
        </motion.button>
      </div>

      <div className="relative z-10 px-4 py-10 pt-20 max-w-5xl mx-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-3 mb-8">
          <Utensils className="w-4 h-4 text-white/35" />
          <div>
            <h1 className="text-[36px] leading-none font-semibold text-white" style={{ fontFamily: OUTFIT, letterSpacing: "-0.03em" }}>Nutrición</h1>
            {athleteOverride && (
              <p className="text-[11px] text-white/40 mt-1" style={{ fontFamily: JAKARTA }}>{athleteOverride.athleteName} · {athleteOverride.email}</p>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="rounded-2xl p-4 mb-6 text-center" style={{ background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)" }}>
            <p className="text-[12px] text-[#fca5a5]" style={{ fontFamily: JAKARTA }}>{error}</p>
          </div>
        )}

        {/* ── PARTE 1 ── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="space-y-3 mb-8">
          <SectionTitle title="Prescripción" sub="Prescripción del coach y tu adherencia" />
          <PrescriptionCard goals={goals} onEditClick={() => setGoalsOpen(true)} currentWeight={latestWeight} canEdit={!!user?.isAdmin} />
          <AdherenceCalendar rows={rows} refeeds={refeeds} rangeDays={90} />
        </motion.section>

        <Divider />

        {/* ── PARTE 2 ── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="space-y-4 my-8">
          <SectionTitle title="Monitoreo general" />

          <div className="grid grid-cols-3 gap-2">
            <div className="relative rounded-2xl p-3 sm:p-4" style={glassKpi}>
              <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.4), transparent)" }} />
              <p className="text-[8px] sm:text-[9px] font-semibold tracking-[0.12em] text-white/40 uppercase mb-1.5" style={{ fontFamily: JAKARTA }}>Peso</p>
              <p className="text-[22px] sm:text-[30px] leading-none font-semibold text-white tabular-nums" style={{ fontFamily: OUTFIT, letterSpacing: "-0.025em" }}>
                {latestWeight != null ? latestWeight.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-white/35 mt-1" style={{ fontFamily: JAKARTA }}>kg</p>
            </div>

            <div className="relative rounded-2xl p-3 sm:p-4" style={glassKpi}>
              <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.4), transparent)" }} />
              <p className="text-[8px] sm:text-[9px] font-semibold tracking-[0.12em] text-white/40 uppercase mb-1.5" style={{ fontFamily: JAKARTA }}>Mant.</p>
              <p className={`text-[22px] sm:text-[30px] leading-none font-semibold tabular-nums ${maintenance.maintenance != null ? "text-white" : "text-white/30"}`} style={{ fontFamily: OUTFIT, letterSpacing: "-0.025em" }}>
                {maintenance.maintenance != null ? maintenance.maintenance.toLocaleString('en-US') : "—"}
              </p>
              <p className={`text-[9px] sm:text-[10px] mt-1 ${maintenance.maintenance != null ? "text-white/35" : "text-white/25"}`} style={{ fontFamily: JAKARTA }}>
                {maintenance.confidence === "high" ? "alta" : maintenance.confidence === "medium" ? "media" : maintenance.confidence === "low" ? "baja" : "≥10 días"}
              </p>
            </div>

            <div className="relative rounded-2xl p-3 sm:p-4" style={glassKpi}>
              <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.4), transparent)" }} />
              <p className="text-[8px] sm:text-[9px] font-semibold tracking-[0.12em] text-white/40 uppercase mb-1.5" style={{ fontFamily: JAKARTA }}>Avg 14d</p>
              <p className="text-[22px] sm:text-[30px] leading-none font-semibold text-white tabular-nums" style={{ fontFamily: OUTFIT, letterSpacing: "-0.025em" }}>
                {kcalAvg14 != null ? kcalAvg14.toLocaleString('en-US') : "—"}
              </p>
              {goals.kcalTarget != null && kcalAvg14 != null && (
                <p className={`text-[9px] sm:text-[10px] mt-1 ${Math.abs(kcalAvg14 - goals.kcalTarget) <= goals.kcalTarget * 0.05 ? "text-[#6ee7a0]" : kcalAvg14 > goals.kcalTarget ? "text-[#fca5a5]" : "text-[#93c5fd]"}`} style={{ fontFamily: JAKARTA }}>
                  obj {goals.kcalTarget.toLocaleString('en-US')}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Peso corporal + MA7"
              range={bwRange}
              onRange={setBwRange}
              action={
                <button
                  type="button"
                  onClick={() => setWeightTablesOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold tracking-[0.06em] text-white/55 hover:text-white transition-colors shrink-0"
                  style={{
                    fontFamily: JAKARTA,
                    background: "hsla(0,0%,100%,0.08)",
                    border: "1px solid hsla(0,0%,100%,0.14)",
                  }}
                  title="Tabla de datos"
                >
                  <Table2 className="w-3 h-3" />
                  Tabla
                </button>
              }
            >
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={bwData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.4)" }} />
                  <Line type="monotone" dataKey="Peso" stroke="rgba(255,255,255,0.2)" strokeWidth={1} dot={false} connectNulls />
                  <Line type="monotone" dataKey="MA7" stroke="#6ee7a0" strokeWidth={2.5} dot={false} connectNulls />
                  {goals.targetWeight != null && (
                    <ReferenceLine y={goals.targetWeight} stroke="rgba(255,255,255,0.25)" strokeDasharray="5 3"
                      label={{ value: `obj ${goals.targetWeight}`, position: "insideTopRight", fill: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: JAKARTA }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Promedio semanal — peso y calorías" range={weeklyRange} onRange={setWeeklyRange}>
              <ResponsiveContainer width="100%" height={190}>
                <ComposedChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.4)" }} />
                  <Bar yAxisId="right" dataKey="Kcal prom" fill="rgba(255,255,255,0.12)" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="left" type="monotone" dataKey="Peso prom" stroke="#6ee7a0" strokeWidth={2.5} dot={{ fill: "#6ee7a0", r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </motion.section>

        <Divider />

        {/* ── PARTE 3 ── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="space-y-4 mt-8">
          <SectionTitle title="Macronutrientes y actividad" />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Macronutrientes diarios (g)" range={macrosRange} onRange={setMacrosRange}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={macrosData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.4)" }} />
                  <Bar dataKey="Proteína" stackId="a" fill="#6ee7a0" />
                  <Bar dataKey="Carbs" stackId="a" fill="#93c5fd" />
                  <Bar dataKey="Grasa" stackId="a" fill="#fcd34d" />
                  <Bar dataKey="Fibra" stackId="a" fill="#c4b5fd" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Pasos y cardio" range={actRange} onRange={setActRange}>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={actData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.4)" }} />
                  {goals.stepsTarget != null && (
                    <ReferenceLine yAxisId="left" y={goals.stepsTarget} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                  )}
                  <Bar yAxisId="left" dataKey="Pasos" fill="rgba(255,255,255,0.18)" radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Cardio (min)" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </motion.section>

      </div>

      <GoalsModal
        open={goalsOpen}
        goals={goals}
        currentWeight={latestWeight}
        maintenanceKcal={maintenance.maintenance}
        rows={rows}
        onSave={handleGoalsSave}
        onClose={() => setGoalsOpen(false)}
        saveContext={effectiveCtx}
        prescribedBy={user?.email ?? undefined}
      />
      <AddEntryModal open={entryOpen} onClose={() => setEntryOpen(false)} onSaved={refetch} />
      <WeightDataTablesModal
        open={weightTablesOpen}
        rows={rows}
        onClose={() => setWeightTablesOpen(false)}
      />
    </DarkLayout>
  );
}
