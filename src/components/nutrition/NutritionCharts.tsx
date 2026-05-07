import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area,
} from "recharts";
import {
  NutritionRow,
  Goals,
  rollingMean,
  weeklyAggregates,
  filterByRange,
  todayLocalISO,
} from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const glassPanel = {
  background: "linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.03) 100%)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid hsla(0,0%,100%,0.12)",
  boxShadow: "0 6px 20px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.2)",
} as const;

const axisStyle = { fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: JAKARTA };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-[11px]"
      style={{
        background: "hsla(0,0%,8%,0.9)",
        border: "1px solid hsla(0,0%,100%,0.18)",
        backdropFilter: "blur(20px)",
        fontFamily: JAKARTA,
        color: "rgba(255,255,255,0.85)",
      }}
    >
      <div className="font-semibold mb-1 text-white/60">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(p.name.includes("kg") || p.name.includes("Peso") ? 1 : 0) : p.value}
          {p.name.includes("kcal") || p.name.includes("Kcal") || p.name.includes("Cal") ? " kcal" :
           p.name.includes("Peso") || p.name.includes("MA7") ? " kg" :
           p.name.includes("Proteína") || p.name.includes("Carbs") || p.name.includes("Grasa") || p.name.includes("Fibra") ? " g" : ""}
        </div>
      ))}
    </div>
  );
};

const ChartWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="relative rounded-2xl p-4 pb-2" style={glassPanel}>
    <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.3), transparent)" }} />
    <h3 className="text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase mb-3" style={{ fontFamily: JAKARTA }}>{title}</h3>
    {children}
  </div>
);

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

interface Props {
  rows: NutritionRow[];
  goals: Goals;
  maintenance: number | null;
  rangeDays: number;
}

export const NutritionCharts = ({ rows, goals, maintenance, rangeDays }: Props) => {
  const rangeRows = useMemo(() => filterByRange(rows, rangeDays), [rows, rangeDays]);

  /* ── BW + MA7 ── */
  const bwData = useMemo(() => {
    const ma7 = rollingMean(rangeRows.map(r => r.bodyweight), 7);
    return rangeRows.map((r, i) => ({
      date: fmtDate(r.date),
      "Peso": r.bodyweight,
      "MA7": ma7[i] != null ? parseFloat((ma7[i] as number).toFixed(2)) : null,
    }));
  }, [rangeRows]);

  /* ── Kcal vs target ── */
  const kcalData = useMemo(() => rangeRows.map(r => ({
    date: fmtDate(r.date),
    "Kcal": r.calories,
  })), [rangeRows]);

  const kcalTarget = goals.kcalTarget;

  /* ── Macros stacked bar ── */
  const macrosData = useMemo(() => rangeRows.map(r => ({
    date: fmtDate(r.date),
    "Proteína": r.protein,
    "Carbs": r.carbs,
    "Grasa": r.fat,
    "Fibra": r.fiber,
  })), [rangeRows]);

  /* ── Weekly avg weight ── */
  const weeklyData = useMemo(() => {
    const aggs = weeklyAggregates(rangeRows);
    return aggs.map(w => ({
      week: fmtDate(w.weekStart),
      "Peso prom": w.avgWeight != null ? parseFloat(w.avgWeight.toFixed(2)) : null,
      "Kcal prom": w.avgCals != null ? Math.round(w.avgCals) : null,
    }));
  }, [rangeRows]);

  /* ── Steps + Cardio ── */
  const actData = useMemo(() => rangeRows.map(r => ({
    date: fmtDate(r.date),
    "Pasos": r.steps,
    "Cardio (min)": r.cardio != null ? (typeof r.cardio === "string" ? (parseFloat(r.cardio) || 0) : r.cardio) : 0,
  })), [rangeRows]);

  const chartH = 180;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* BW + MA7 */}
      <ChartWrapper title="Peso corporal + MA7">
        <ResponsiveContainer width="100%" height={chartH}>
          <ComposedChart data={bwData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.5)" }} />
            <Area type="monotone" dataKey="Peso" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} dot={false} connectNulls />
            <Line type="monotone" dataKey="MA7" stroke="#6ee7a0" strokeWidth={2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Kcal vs target */}
      <ChartWrapper title="Calorías diarias vs target">
        <ResponsiveContainer width="100%" height={chartH}>
          <BarChart data={kcalData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {kcalTarget != null && (
              <ReferenceLine y={kcalTarget} stroke="#6ee7a0" strokeDasharray="6 3" strokeWidth={1.5}
                label={{ value: `${kcalTarget}`, position: "insideTopRight", fill: "#6ee7a0", fontSize: 9, fontFamily: JAKARTA }}
              />
            )}
            {maintenance != null && (
              <ReferenceLine y={maintenance} stroke="#fcd34d" strokeDasharray="4 4" strokeWidth={1}
                label={{ value: `mant.${maintenance}`, position: "insideBottomRight", fill: "#fcd34d", fontSize: 9, fontFamily: JAKARTA }}
              />
            )}
            <Bar dataKey="Kcal" fill="rgba(255,255,255,0.25)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Macros stacked */}
      <ChartWrapper title="Macronutrientes diarios (g)">
        <ResponsiveContainer width="100%" height={chartH}>
          <BarChart data={macrosData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.5)" }} />
            <Bar dataKey="Proteína" stackId="a" fill="#6ee7a0" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Carbs" stackId="a" fill="#93c5fd" />
            <Bar dataKey="Grasa" stackId="a" fill="#fcd34d" />
            <Bar dataKey="Fibra" stackId="a" fill="#c4b5fd" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Weekly avg weight */}
      <ChartWrapper title="Promedio semanal — peso y calorías">
        <ResponsiveContainer width="100%" height={chartH}>
          <ComposedChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="week" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.5)" }} />
            <Bar yAxisId="right" dataKey="Kcal prom" fill="rgba(255,255,255,0.15)" radius={[2, 2, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="Peso prom" stroke="#6ee7a0" strokeWidth={2.5} dot={{ fill: "#6ee7a0", r: 3 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Steps + Cardio — full width */}
      <div className="lg:col-span-2">
        <ChartWrapper title="Pasos y cardio">
          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={actData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: JAKARTA, color: "rgba(255,255,255,0.5)" }} />
              {goals.stepsTarget != null && (
                <ReferenceLine yAxisId="left" y={goals.stepsTarget} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />
              )}
              <Bar yAxisId="left" dataKey="Pasos" fill="rgba(255,255,255,0.2)" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="right" dataKey="Cardio (min)" fill="#93c5fd" radius={[2, 2, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>
    </div>
  );
};
