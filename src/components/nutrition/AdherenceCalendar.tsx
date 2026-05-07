import { useMemo } from "react";
import { NutritionRow, buildCalendar, rowAdherence, addDays, todayLocalISO } from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

interface Props {
  rows: NutritionRow[];
  refeeds: Set<string>;
  rangeDays?: number;
}

export const AdherenceCalendar = ({ rows, refeeds, rangeDays = 90 }: Props) => {
  const today = todayLocalISO();
  const from = addDays(today, -(rangeDays - 1));

  const calendar = useMemo(
    () => buildCalendar(rows, refeeds, from, today),
    [rows, refeeds, from, today]
  );

  const stats = useMemo(() => {
    const past = calendar.filter(d => d.date <= today);
    const full = past.filter(d => d.row && rowAdherence(d.row) === "full").length;
    const partial = past.filter(d => d.row && rowAdherence(d.row) === "partial").length;
    return { full, partial, pct: past.length ? Math.round((full / past.length) * 100) : 0 };
  }, [calendar, today]);

  const dotColor = (day: typeof calendar[0]): string => {
    if (day.date > today) return "hsla(0,0%,100%,0.07)";
    if (day.isRefeed) return "hsla(250,60%,70%,0.7)";
    if (!day.row) return "hsla(0,0%,100%,0.1)";
    const s = rowAdherence(day.row);
    if (s === "full") return "hsla(142,60%,55%,0.85)";
    if (s === "partial") return "hsla(44,75%,58%,0.7)";
    return "hsla(0,0%,100%,0.1)";
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-2xl"
      style={{
        background: "linear-gradient(135deg, hsla(0,0%,100%,0.06) 0%, hsla(0,0%,100%,0.02) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid hsla(0,0%,100%,0.09)",
        boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.12)",
      }}
    >
      {/* Label + stats */}
      <div className="shrink-0 flex flex-col gap-0.5 w-20">
        <span className="text-[9px] font-semibold tracking-[0.16em] text-white/35 uppercase" style={{ fontFamily: JAKARTA }}>
          Adherencia
        </span>
        <span className="text-[18px] font-semibold leading-none text-white" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
          {stats.pct}%
        </span>
        <span className="text-[9px] text-white/25 leading-tight" style={{ fontFamily: JAKARTA }}>
          {stats.full}d completos
        </span>
      </div>

      {/* Dot strip */}
      <div className="flex-1 flex flex-wrap gap-[4px]">
        {calendar.map((day) => {
          const isToday = day.date === today;
          return (
            <div
              key={day.date}
              title={`${day.date}${day.isRefeed ? " · Refeed" : ""}${day.row ? ` · ${rowAdherence(day.row)}` : " · sin datos"}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: dotColor(day),
                flexShrink: 0,
                outline: isToday ? "1.5px solid rgba(255,255,255,0.6)" : "none",
                outlineOffset: 1,
                transition: "background 0.2s",
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="shrink-0 flex flex-col gap-1.5">
        {[
          ["hsla(142,60%,55%,0.85)", "Completo"],
          ["hsla(44,75%,58%,0.7)", "Parcial"],
          ["hsla(0,0%,100%,0.1)", "Sin datos"],
          ["hsla(250,60%,70%,0.7)", "Refeed"],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span className="text-[8px] text-white/30 whitespace-nowrap" style={{ fontFamily: JAKARTA }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
