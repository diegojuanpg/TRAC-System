import { useMemo, useState } from "react";
import {
  NutritionRow,
  Goals,
  buildCalendar,
  calorieStatus,
  rowAdherence,
  CalorieStatus,
  addDays,
  todayLocalISO,
} from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

type CalView = "adherence" | "calories" | "protein" | "steps" | "cardio" | "weight";

const VIEWS: { key: CalView; label: string }[] = [
  { key: "adherence", label: "Adherencia" },
  { key: "calories", label: "Calorías" },
  { key: "protein", label: "Proteína" },
  { key: "steps", label: "Pasos" },
  { key: "cardio", label: "Cardio" },
  { key: "weight", label: "Peso" },
];

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

interface DayCell {
  date: string;
  row: NutritionRow | null;
  isRefeed: boolean;
}

function dayColor(day: DayCell, view: CalView, goals: Goals): string {
  if (!day.row && !day.isRefeed) return "bg-white/[0.04] border-white/[0.06]";
  if (day.isRefeed) return "bg-violet-400/30 border-violet-300/30";

  const row = day.row!;

  switch (view) {
    case "adherence": {
      const s = rowAdherence(row);
      if (s === "full") return "bg-[#6ee7a0]/30 border-[#6ee7a0]/30";
      if (s === "partial") return "bg-[#fcd34d]/25 border-[#fcd34d]/25";
      return "bg-white/[0.04] border-white/[0.06]";
    }
    case "calories": {
      const s = calorieStatus(row, goals.kcalTarget, false);
      const map: Record<CalorieStatus, string> = {
        over: "bg-[#fca5a5]/30 border-[#fca5a5]/30",
        slightly_over: "bg-[#fdba74]/25 border-[#fdba74]/25",
        on: "bg-[#6ee7a0]/30 border-[#6ee7a0]/30",
        slightly_under: "bg-[#93c5fd]/25 border-[#93c5fd]/25",
        under: "bg-[#60a5fa]/30 border-[#60a5fa]/30",
        none: "bg-white/[0.04] border-white/[0.06]",
        refeed: "bg-violet-400/30 border-violet-300/30",
      };
      return map[s];
    }
    case "protein": {
      if (row.protein === null || goals.proteinTarget === null) return "bg-white/[0.04] border-white/[0.06]";
      const r = row.protein / goals.proteinTarget;
      if (r >= 0.95) return "bg-[#6ee7a0]/30 border-[#6ee7a0]/30";
      if (r >= 0.80) return "bg-[#fcd34d]/25 border-[#fcd34d]/25";
      return "bg-[#fca5a5]/25 border-[#fca5a5]/25";
    }
    case "steps": {
      if (row.steps === null || goals.stepsTarget === null) return "bg-white/[0.04] border-white/[0.06]";
      const r = row.steps / goals.stepsTarget;
      if (r >= 1) return "bg-[#6ee7a0]/30 border-[#6ee7a0]/30";
      if (r >= 0.75) return "bg-[#fcd34d]/25 border-[#fcd34d]/25";
      return "bg-[#fca5a5]/25 border-[#fca5a5]/25";
    }
    case "cardio": {
      const c = row.cardio;
      const mins = c != null ? (typeof c === "string" ? parseFloat(c) || 0 : c) : 0;
      if (mins >= 30) return "bg-[#6ee7a0]/30 border-[#6ee7a0]/30";
      if (mins > 0) return "bg-[#fcd34d]/25 border-[#fcd34d]/25";
      return "bg-white/[0.04] border-white/[0.06]";
    }
    case "weight": {
      return row.bodyweight !== null
        ? "bg-[#93c5fd]/25 border-[#93c5fd]/25"
        : "bg-white/[0.04] border-white/[0.06]";
    }
  }
}

function dayTooltip(day: DayCell, view: CalView, goals: Goals): string {
  const d = new Date(day.date + "T00:00:00");
  const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  if (day.isRefeed) return `${dateStr}\nRefeed`;
  if (!day.row) return `${dateStr}\nSin datos`;
  const r = day.row;
  const lines = [dateStr];
  if (r.bodyweight != null) lines.push(`Peso: ${r.bodyweight}kg`);
  if (r.calories != null) {
    const t = goals.kcalTarget;
    lines.push(`Kcal: ${r.calories}${t != null ? ` / ${t}` : ""}`);
  }
  if (r.protein != null) lines.push(`Proteína: ${r.protein}g`);
  if (r.steps != null) lines.push(`Pasos: ${r.steps.toLocaleString()}`);
  return lines.join("\n");
}

interface Props {
  rows: NutritionRow[];
  goals: Goals;
  refeeds: Set<string>;
  rangeDays: number;
  onToggleRefeed?: (date: string, current: boolean) => void;
}

export const NutritionCalendar = ({ rows, goals, refeeds, rangeDays, onToggleRefeed }: Props) => {
  const [view, setView] = useState<CalView>("adherence");

  const today = todayLocalISO();
  const from = addDays(today, -(rangeDays - 1));

  const calendar = useMemo(
    () => buildCalendar(rows, refeeds, from, today),
    [rows, refeeds, from, today]
  );

  // Group by month for header rendering
  const weeks = useMemo(() => {
    // Pad start to Monday
    const startDate = new Date(from + "T00:00:00");
    const dow = (startDate.getDay() + 6) % 7; // 0=Mon
    const padded: (DayCell | null)[] = [];
    for (let i = 0; i < dow; i++) padded.push(null);
    padded.push(...calendar);
    const ws: (DayCell | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) ws.push(padded.slice(i, i + 7));
    return ws;
  }, [calendar, from]);

  const glassPanel = {
    background: "linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.03) 100%)",
    backdropFilter: "blur(24px) saturate(160%)",
    WebkitBackdropFilter: "blur(24px) saturate(160%)",
    border: "1px solid hsla(0,0%,100%,0.12)",
    boxShadow: "0 6px 20px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.2)",
  };

  return (
    <div className="relative rounded-2xl p-4" style={glassPanel}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.3), transparent)" }} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase" style={{ fontFamily: JAKARTA }}>
          Calendario
        </h3>
        {/* View toggle */}
        <div className="flex flex-wrap gap-1">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[0.1em] transition-all ${
                view === v.key
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              style={{
                fontFamily: JAKARTA,
                background: view === v.key ? "hsla(0,0%,100%,0.16)" : "transparent",
                border: "1px solid " + (view === v.key ? "hsla(0,0%,100%,0.25)" : "transparent"),
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <CalendarLegend view={view} />

      {/* DOW headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-white/30 font-semibold" style={{ fontFamily: JAKARTA }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const isFuture = day.date > today;
              const color = isFuture ? "opacity-20 bg-white/[0.02] border-white/[0.04]" : dayColor(day, view, goals);
              const d = new Date(day.date + "T00:00:00");
              const isToday = day.date === today;
              return (
                <button
                  key={di}
                  title={dayTooltip(day, view, goals)}
                  disabled={isFuture || !onToggleRefeed}
                  onClick={() => onToggleRefeed?.(day.date, day.isRefeed)}
                  className={`relative aspect-square rounded-md border text-[9px] font-semibold transition-all ${color} ${
                    isToday ? "ring-1 ring-white/50" : ""
                  } ${!isFuture && onToggleRefeed ? "cursor-pointer hover:brightness-125" : "cursor-default"}`}
                  style={{ fontFamily: JAKARTA, color: isFuture ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const CalendarLegend = ({ view }: { view: CalView }) => {
  const items: [string, string][] = useMemo(() => {
    switch (view) {
      case "adherence":
        return [["Verde", "Completo"], ["Amarillo", "Parcial"], ["Gris", "Sin datos"]];
      case "calories":
        return [
          ["Verde", "En target ±5%"],
          ["Amarillo", "+5–10%"],
          ["Rojo", "+10%"],
          ["Azul claro", "-5–10%"],
          ["Azul", "-10%"],
          ["Violeta", "Refeed"],
        ];
      case "protein":
        return [["Verde", "≥95% target"], ["Amarillo", "80-95%"], ["Rojo", "<80%"]];
      case "steps":
        return [["Verde", "≥100% target"], ["Amarillo", "75-100%"], ["Rojo", "<75%"]];
      case "cardio":
        return [["Verde", "≥30 min"], ["Amarillo", ">0 min"], ["Gris", "Sin cardio"]];
      case "weight":
        return [["Azul", "Peso registrado"], ["Gris", "Sin registro"]];
    }
  }, [view]);

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
      {items.map(([color, label]) => (
        <span key={label} className="flex items-center gap-1 text-[9px] text-white/40" style={{ fontFamily: JAKARTA }}>
          <span>{color}</span>
          <span className="text-white/25">·</span>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
};
