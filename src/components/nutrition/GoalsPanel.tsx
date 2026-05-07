import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Save, History, Lock } from "lucide-react";
import {
  Line, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Goals, NutritionRow, EMPTY_GOALS, MacroUnit, AutoManual,
  todayLocalISO, daysBetween, addDays,
  bodyweightWeekDelta, calWeekDelta, weeklyAggregates, filterByRange,
  kgWeekToKcalDay, kcalDayToKgWeek, KCAL_PER_G, pctToGrams, gramsToPct,
} from "@/lib/nutritionMath";
import { saveGoals, fetchGoalsHistory, GoalSnapshot } from "@/lib/nutritionApi";
import { useUser } from "@/context/UserContext";

const COACH_EMAIL = "diegojp2005@gmail.com";
const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

/* Number format: 1,234.5 (en-US) */
const fmtNum = (v: number | null | undefined, dec = 0): string => {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

/* Apply sign to raw input string based on mode (cut=neg, bulk=pos, maintenance=0) */
function applySign(raw: string, mode: Goals["mode"]): string {
  if (mode === 'maintenance') return "0";
  if (raw === "" || raw === "-") return raw;
  const n = parseFloat(raw);
  if (isNaN(n)) return raw;
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  return mode === 'cut' ? `-${abs}` : `${abs}`;
}

const inputStyle = {
  background: "hsla(0,0%,100%,0.05)",
  border: "1px solid hsla(0,0%,100%,0.12)",
  borderRadius: 10,
  color: "rgba(255,255,255,0.9)",
  fontFamily: JAKARTA,
  fontSize: 13,
  padding: "6px 10px",
  outline: "none",
  width: "100%",
} as const;

const SubLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9px] font-semibold tracking-[0.18em] text-white/35 uppercase mb-3" style={{ fontFamily: JAKARTA }}>
    {children}
  </p>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[9px] font-semibold tracking-[0.14em] text-white/40 uppercase mb-1" style={{ fontFamily: JAKARTA }}>
    {children}
  </label>
);

/* ── Mini toggle component (auto/manual or gkg/pct) ── */
function MiniToggle<T extends string>({
  options, value, onChange, disabled,
}: { options: [T, T]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex rounded-full p-0.5" style={{ background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => !disabled && onChange(opt)}
          disabled={disabled}
          className="px-2 py-0.5 rounded-full text-[8px] font-semibold tracking-[0.06em] uppercase transition-all"
          style={{
            fontFamily: JAKARTA,
            color: value === opt ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
            background: value === opt ? "hsla(0,0%,100%,0.1)" : "transparent",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ── Cell with a number input + optional toggle / suffix ── */
interface CellProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  toggle?: React.ReactNode;
  computed?: string;
  readOnly?: boolean;
  placeholder?: string;
  highlightColor?: string;
}

const Cell = ({ label, value, onChange, unit, toggle, computed, readOnly, placeholder, highlightColor }: CellProps) => (
  <div className="rounded-xl p-2.5" style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
    <div className="flex items-center justify-between mb-1.5">
      <FieldLabel>{label}</FieldLabel>
      {toggle}
    </div>
    <div className="relative">
      <input
        type={value !== "" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) ? "date" : "number"}
        step="any"
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputStyle,
          opacity: readOnly ? 0.55 : 1,
          cursor: readOnly ? "not-allowed" : "text",
          paddingRight: unit ? 30 : 10,
          color: highlightColor ?? "rgba(255,255,255,0.9)",
          colorScheme: "dark",
        }}
        onFocus={e => !readOnly && (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.35)")}
        onBlur={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.12)")}
      />
      {unit && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/35 pointer-events-none" style={{ fontFamily: JAKARTA }}>
          {unit}
        </span>
      )}
    </div>
    {computed && (
      <p className="mt-1 text-[9px] text-white/40" style={{ fontFamily: JAKARTA }}>{computed}</p>
    )}
  </div>
);

/* ── Date cell (uses native date input) ── */
const DateCell = ({ label, value, onChange, readOnly, computed }: {
  label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; computed?: string;
}) => (
  <div className="rounded-xl p-2.5" style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
    <FieldLabel>{label}</FieldLabel>
    <input
      type="date"
      value={value}
      readOnly={readOnly}
      onChange={e => onChange(e.target.value)}
      style={{
        ...inputStyle,
        opacity: readOnly ? 0.55 : 1,
        cursor: readOnly ? "not-allowed" : "text",
        colorScheme: "dark",
      }}
      onFocus={e => !readOnly && (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.35)")}
      onBlur={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.12)")}
    />
    {computed && (
      <p className="mt-1 text-[9px] text-white/40" style={{ fontFamily: JAKARTA }}>{computed}</p>
    )}
  </div>
);

/* ── Comparison table: peso + cals together ── */
interface CompareRow {
  label: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  unit: string;
  deltaUnit: string;
  decimals?: number;
  deltaThreshold?: number;
}

const KpiCompareTable = ({ rows }: { rows: CompareRow[] }) => {
  const fmt = (v: number | null, dec = 0) => v != null
    ? v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : "—";
  return (
    <div className="rounded-xl p-3" style={{ background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)" }}>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-white/75 uppercase mb-2.5" style={{ fontFamily: JAKARTA }}>Comparación semanal</p>
      {/* header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 pb-1.5 mb-1.5 border-b border-white/[0.07]">
        <span className="text-[8px] font-semibold tracking-[0.12em] text-white/35 uppercase" style={{ fontFamily: JAKARTA }}></span>
        <span className="text-[8px] font-semibold tracking-[0.12em] text-white/60 uppercase text-right" style={{ fontFamily: JAKARTA }}>Pasada</span>
        <span className="text-[8px] font-semibold tracking-[0.12em] text-white/60 uppercase text-right" style={{ fontFamily: JAKARTA }}>Antepasada</span>
        <span className="text-[8px] font-semibold tracking-[0.12em] text-white/60 uppercase text-right" style={{ fontFamily: JAKARTA }}>Δ</span>
      </div>
      {rows.map(r => {
        const threshold = r.deltaThreshold ?? 50;
        const deltaColor = r.delta == null ? "rgba(255,255,255,0.35)"
          : Math.abs(r.delta) < threshold ? "rgba(255,255,255,0.55)"
          : r.delta < 0 ? "#6ee7a0" : "#fca5a5";
        const sign = r.delta != null && r.delta >= 0 ? "+" : "";
        return (
          <div key={r.label} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 items-center py-2 border-b border-white/[0.03] last:border-0 last:pb-0">
            <span className="text-[11px] font-semibold text-white/80" style={{ fontFamily: JAKARTA }}>{r.label}</span>
            <span className="text-[13px] font-semibold text-white tabular-nums text-right" style={{ fontFamily: OUTFIT, letterSpacing: "-0.01em" }}>
              {fmt(r.current, r.decimals)} <span className="text-[9px] text-white/40 font-medium ml-0.5">{r.unit}</span>
            </span>
            <span className="text-[13px] font-medium text-white tabular-nums text-right" style={{ fontFamily: OUTFIT, letterSpacing: "-0.01em" }}>
              {fmt(r.previous, r.decimals)} <span className="text-[9px] text-white/40 font-medium ml-0.5">{r.unit}</span>
            </span>
            <div className="flex justify-end">
              <span className="text-[11px] font-bold tabular-nums text-right bg-white/[0.04] rounded-md px-1.5 py-0.5" style={{ fontFamily: JAKARTA, color: deltaColor, border: `1px solid ${deltaColor}20` }}>
                {r.delta != null ? `${sign}${r.delta.toLocaleString('en-US')}` : "—"}
                {r.delta != null && <span className="text-[9px] font-medium opacity-80 ml-0.5">{r.deltaUnit}</span>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const KpiSingle = ({ label, value, unit, sub }: { label: string; value: string; unit: string; sub: string }) => (
  <div className="rounded-xl p-3.5 flex-1 flex flex-col" style={{ background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)" }}>
    <p className="text-[10px] font-semibold tracking-[0.16em] text-white/75 uppercase mb-2.5" style={{ fontFamily: JAKARTA }}>{label}</p>
    <div className="flex-1 flex flex-col justify-center py-1">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[42px] font-bold leading-none text-white tabular-nums drop-shadow-md" style={{ fontFamily: OUTFIT, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        <span className="text-[13px] font-medium text-white/40" style={{ fontFamily: JAKARTA }}>{unit}</span>
      </div>
      <p className="text-[10px] text-white/40" style={{ fontFamily: JAKARTA }}>{sub}</p>
    </div>
  </div>
);

const axisStyle = { fill: "rgba(255,255,255,0.32)", fontSize: 9, fontFamily: JAKARTA };

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-[11px]" style={{ background: "hsla(0,0%,8%,0.92)", border: "1px solid hsla(0,0%,100%,0.16)", backdropFilter: "blur(20px)", fontFamily: JAKARTA, color: "rgba(255,255,255,0.8)" }}>
      <div className="font-semibold mb-1 text-white/50">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? "rgba(255,255,255,0.75)" }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('en-US') : p.value}
        </div>
      ))}
    </div>
  );
};

const fmtChartDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

interface Props {
  goals: Goals;
  currentWeight: number | null;
  maintenanceKcal: number | null;
  rows: NutritionRow[];
  onSave: (g: Goals) => void;
  saveContext?: { scriptUrl: string | null; sheetId: string | null };
  prescribedBy?: string;
}

type TriangleField = 'rate' | 'date';

export const GoalsPanel = ({ goals, currentWeight, maintenanceKcal, rows, onSave, saveContext, prescribedBy }: Props) => {
  const { user } = useUser();
  const isCoach = true;
  void COACH_EMAIL;
  const [note, setNote] = useState("");

  /* ── Top-level mode ── */
  const [mode, setMode] = useState<Goals["mode"]>(goals.mode ?? "maintenance");

  /* ── Athlete info ── */
  const [startWeightMode, setStartWeightMode] = useState<AutoManual>(goals.startWeightMode ?? 'auto');
  const [startWeightManual, setStartWeightManual] = useState(goals.startWeight?.toString() ?? "");
  const autoStartWeight = currentWeight; // latest from rows
  const effectiveStartWeight = startWeightMode === 'auto'
    ? autoStartWeight
    : (parseFloat(startWeightManual) || null);

  /* ── Weight triangle (Row 1) ── */
  const [targetWeight, setTargetWeight] = useState(goals.targetWeight?.toString() ?? "");
  const [ratePerWeek, setRatePerWeek] = useState(goals.targetRatePerWeek?.toString() ?? "");
  const [targetDate, setTargetDate] = useState(goals.targetDate ?? "");
  // Which of (rate, date) is currently the COMPUTED field
  const [triangleComputed, setTriangleComputed] = useState<TriangleField>(
    goals.targetRatePerWeek != null && !goals.targetDate ? 'date'
      : goals.targetDate && goals.targetRatePerWeek == null ? 'rate'
      : 'date'
  );

  /* ── Calorie row (Row 2) ── */
  const [maintenanceMode, setMaintenanceMode] = useState<AutoManual>(goals.maintenanceMode ?? 'auto');
  const [maintenanceManual, setMaintenanceManual] = useState(goals.maintenanceKcal?.toString() ?? "");
  const [kcalAdjPerDay, setKcalAdjPerDay] = useState(goals.kcalAdjPerDay?.toString() ?? "");

  const effectiveMaintenance = maintenanceMode === 'auto'
    ? maintenanceKcal
    : (parseFloat(maintenanceManual) || null);

  const effectiveAdj = parseFloat(kcalAdjPerDay) || 0;
  const effectiveBalance = effectiveMaintenance != null
    ? Math.round(effectiveMaintenance + effectiveAdj)
    : null;

  /* ── Macros (Row 3) ── */
  const [proteinUnit, setProteinUnit] = useState<MacroUnit>(goals.proteinUnit ?? 'gkg');
  const [proteinValue, setProteinValue] = useState(
    (goals.proteinUnit === 'pct' ? goals.proteinPct : goals.proteinPerKg)?.toString() ?? ""
  );
  const [fatUnit, setFatUnit] = useState<MacroUnit>(goals.fatUnit ?? 'gkg');
  const [fatValue, setFatValue] = useState(
    (goals.fatUnit === 'pct' ? goals.fatPct : goals.fatPerKg)?.toString() ?? ""
  );
  const [carbsUnit, setCarbsUnit] = useState<MacroUnit>(goals.carbsUnit ?? 'gkg');
  const [carbsValue, setCarbsValue] = useState(
    (goals.carbsUnit === 'pct' ? goals.carbsPct : goals.carbsPerKg)?.toString() ?? ""
  );

  /* ── Other (Row 4) ── */
  const [fiberTarget, setFiberTarget] = useState(goals.fiberTarget?.toString() ?? "");
  const [cardioTarget, setCardioTarget] = useState(goals.cardioTarget?.toString() ?? "");
  const [stepsTarget, setStepsTarget] = useState(goals.stepsTarget?.toString() ?? "");

  /* ── Save state ── */
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<GoalSnapshot[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  /* ── Fast info stats ── */
  const bwDelta = useMemo(() => bodyweightWeekDelta(rows), [rows]);
  const calDelta = useMemo(() => calWeekDelta(rows), [rows]);

  /* ── Weekly chart data (last 90 days) ── */
  const chartData = useMemo(() => {
    return weeklyAggregates(filterByRange(rows, 90)).map(w => ({
      week: fmtChartDate(w.weekStart),
      "Peso prom": w.avgWeight != null ? parseFloat(w.avgWeight.toFixed(2)) : null,
      "Kcal prom": w.avgCals != null ? Math.round(w.avgCals) : null,
    }));
  }, [rows]);

  /* ── Triangle linking: Row 1 (peso/rate/date) ↔ Row 2 (kcalAdjPerDay) ── */

  // When rate changes (manually or computed), also reflect kcalAdjPerDay
  // When kcalAdjPerDay changes manually, update rate
  // Avoid infinite loops by tracking source of truth

  // Compute date from peso + rate
  const computedDate = useMemo(() => {
    if (triangleComputed !== 'date') return null;
    const sw = effectiveStartWeight;
    const tw = parseFloat(targetWeight);
    const r = parseFloat(ratePerWeek);
    if (!sw || isNaN(tw) || isNaN(r) || r === 0) return null;
    const weeks = (tw - sw) / r;
    if (weeks <= 0 || weeks > 520) return null;
    return addDays(todayLocalISO(), Math.round(weeks * 7));
  }, [triangleComputed, effectiveStartWeight, targetWeight, ratePerWeek]);

  // Compute rate from peso + date
  const computedRate = useMemo(() => {
    if (triangleComputed !== 'rate') return null;
    const sw = effectiveStartWeight;
    const tw = parseFloat(targetWeight);
    if (!sw || isNaN(tw) || !targetDate) return null;
    const days = daysBetween(todayLocalISO(), targetDate);
    if (days <= 0) return null;
    return parseFloat(((tw - sw) / (days / 7)).toFixed(3));
  }, [triangleComputed, effectiveStartWeight, targetWeight, targetDate]);

  // Sync computed → input field
  useEffect(() => {
    if (triangleComputed === 'date' && computedDate) setTargetDate(computedDate);
  }, [computedDate, triangleComputed]);
  useEffect(() => {
    if (triangleComputed === 'rate' && computedRate != null) {
      setRatePerWeek(applySign(computedRate.toString(), mode));
    }
  }, [computedRate, triangleComputed, mode]);

  // Flip sign of rate + adj when mode changes
  useEffect(() => {
    setRatePerWeek(prev => applySign(prev, mode));
    setKcalAdjPerDay(prev => applySign(prev, mode));
  }, [mode]);

  // Effective rate for downstream (kcalAdj computation)
  const effectiveRate = parseFloat(ratePerWeek);

  // Auto-fill kcalAdjPerDay from rate if user hasn't manually set it
  // Strategy: if rate changes, recompute adj and overwrite. If user types in adj, recompute rate.
  const [adjLocked, setAdjLocked] = useState(false); // true when user is editing adj manually

  useEffect(() => {
    if (adjLocked) return;
    if (!isNaN(effectiveRate)) {
      const newAdj = kgWeekToKcalDay(effectiveRate);
      setKcalAdjPerDay(newAdj.toString());
    }
  }, [effectiveRate, adjLocked]);

  /* ── Macro computations ── */
  const balance = effectiveBalance ?? 0;
  const sw = effectiveStartWeight ?? 0;

  function macroDerived(unit: MacroUnit, valStr: string, kcalPerG: number): {
    grams: number | null; perKg: number | null; pct: number | null;
  } {
    const v = parseFloat(valStr);
    if (isNaN(v)) return { grams: null, perKg: null, pct: null };
    if (unit === 'gkg') {
      const grams = sw > 0 ? Math.round(v * sw) : null;
      const pct = grams != null && balance > 0 ? gramsToPct(grams, balance, kcalPerG) : null;
      return { grams, perKg: v, pct };
    } else {
      // pct
      const grams = balance > 0 ? pctToGrams(v, balance, kcalPerG) : null;
      const perKg = grams != null && sw > 0 ? parseFloat((grams / sw).toFixed(2)) : null;
      return { grams, perKg, pct: v };
    }
  }

  const proteinDerived = useMemo(() => macroDerived(proteinUnit, proteinValue, KCAL_PER_G.protein),
    [proteinUnit, proteinValue, sw, balance]);
  const fatDerived = useMemo(() => macroDerived(fatUnit, fatValue, KCAL_PER_G.fat),
    [fatUnit, fatValue, sw, balance]);
  const carbsDerived = useMemo(() => macroDerived(carbsUnit, carbsValue, KCAL_PER_G.carbs),
    [carbsUnit, carbsValue, sw, balance]);

  // Auto-fill 3rd macro when 2 are filled, to fit balance kcal
  useEffect(() => {
    if (!effectiveBalance || effectiveBalance <= 0) return;
    const fields = [
      { key: 'protein', unit: proteinUnit, value: proteinValue, kpg: KCAL_PER_G.protein, set: setProteinValue },
      { key: 'fat', unit: fatUnit, value: fatValue, kpg: KCAL_PER_G.fat, set: setFatValue },
      { key: 'carbs', unit: carbsUnit, value: carbsValue, kpg: KCAL_PER_G.carbs, set: setCarbsValue },
    ];
    const filled = fields.map(f => {
      const trimmed = f.value.trim();
      if (trimmed === "" || trimmed === "-") return null;
      const v = parseFloat(trimmed);
      if (isNaN(v) || v <= 0) return null;
      return { ...f, parsed: v };
    });
    const filledCount = filled.filter(f => f !== null).length;
    if (filledCount !== 2) return;

    let usedKcal = 0;
    filled.forEach((f) => {
      if (!f) return;
      const grams = f.unit === 'gkg'
        ? (sw > 0 ? f.parsed * sw : 0)
        : pctToGrams(f.parsed, effectiveBalance, f.kpg);
      usedKcal += grams * f.kpg;
    });
    const remaining = effectiveBalance - usedKcal;
    if (remaining <= 0) return;

    const emptyIdx = filled.findIndex(f => f === null);
    if (emptyIdx === -1) return;
    const empty = fields[emptyIdx];
    const grams = remaining / empty.kpg;
    const newValue = empty.unit === 'gkg'
      ? (sw > 0 ? (grams / sw).toFixed(2) : "")
      : ((grams * empty.kpg / effectiveBalance) * 100).toFixed(1);
    if (newValue && newValue !== empty.value) {
      empty.set(newValue);
    }
  }, [proteinValue, fatValue, carbsValue, proteinUnit, fatUnit, carbsUnit, effectiveBalance, sw]);

  // When user toggles unit, convert current value to new unit
  function switchProteinUnit(newUnit: MacroUnit) {
    if (newUnit === proteinUnit) return;
    const d = proteinDerived;
    if (newUnit === 'gkg' && d.perKg != null) setProteinValue(d.perKg.toString());
    else if (newUnit === 'pct' && d.pct != null) setProteinValue(d.pct.toString());
    else setProteinValue("");
    setProteinUnit(newUnit);
  }
  function switchFatUnit(newUnit: MacroUnit) {
    if (newUnit === fatUnit) return;
    const d = fatDerived;
    if (newUnit === 'gkg' && d.perKg != null) setFatValue(d.perKg.toString());
    else if (newUnit === 'pct' && d.pct != null) setFatValue(d.pct.toString());
    else setFatValue("");
    setFatUnit(newUnit);
  }
  function switchCarbsUnit(newUnit: MacroUnit) {
    if (newUnit === carbsUnit) return;
    const d = carbsDerived;
    if (newUnit === 'gkg' && d.perKg != null) setCarbsValue(d.perKg.toString());
    else if (newUnit === 'pct' && d.pct != null) setCarbsValue(d.pct.toString());
    else setCarbsValue("");
    setCarbsUnit(newUnit);
  }

  /* ── Save ── */
  const handleSave = async () => {
    if (!isCoach || !user) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload: Goals = {
        ...EMPTY_GOALS,
        mode,
        startWeight: startWeightMode === 'manual' ? (parseFloat(startWeightManual) || null) : null,
        startWeightMode,
        targetWeight: parseFloat(targetWeight) || null,
        targetRatePerWeek: parseFloat(ratePerWeek) || null,
        targetDate: targetDate || null,
        maintenanceKcal: effectiveMaintenance,
        maintenanceMode,
        kcalAdjPerDay: parseFloat(kcalAdjPerDay) || null,
        balanceKcal: effectiveBalance,
        proteinUnit,
        proteinPerKg: proteinDerived.perKg,
        proteinPct: proteinDerived.pct,
        proteinTarget: proteinDerived.grams,
        fatUnit,
        fatPerKg: fatDerived.perKg,
        fatPct: fatDerived.pct,
        fatTarget: fatDerived.grams,
        carbsUnit,
        carbsPerKg: carbsDerived.perKg,
        carbsPct: carbsDerived.pct,
        carbsTarget: carbsDerived.grams,
        kcalTarget: effectiveBalance,
        fiberTarget: parseFloat(fiberTarget) || null,
        cardioTarget: parseFloat(cardioTarget) || null,
        stepsTarget: parseFloat(stepsTarget) || null,
        waterTarget: goals.waterTarget,
      };
      const ctx = saveContext ?? user;
      const byEmail = prescribedBy ?? user.email;
      await saveGoals(ctx, byEmail, payload, note);
      onSave(payload);
      setSaveMsg("Guardado.");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg("Error: " + (err instanceof Error ? err.message : "desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setHistLoading(true);
    try {
      const h = await fetchGoalsHistory(user);
      setHistory(h.reverse());
    } catch { /* ignore */ }
    setHistLoading(false);
    setShowHistory(true);
  };

  /* ── Format helpers ── */

  const isMaintenance = mode === 'maintenance';
  const rateLabel = mode === 'cut' ? 'Pérdida (kg/sem)'
    : mode === 'bulk' ? 'Ganancia (kg/sem)' : 'Mantenimiento';
  const adjLabel = mode === 'cut' ? 'Pérdida kcal/día'
    : mode === 'bulk' ? 'Ganancia kcal/día' : 'Ajuste kcal/día';

  const totalMacroKcal = (proteinDerived.grams ?? 0) * 4
    + (fatDerived.grams ?? 0) * 9
    + (carbsDerived.grams ?? 0) * 4;
  const macroKcalDelta = effectiveBalance != null && totalMacroKcal > 0
    ? totalMacroKcal - effectiveBalance : null;

  return (
    <div className="space-y-5">

      {/* ── PARTE 1: DASHBOARD ── */}
      <div>
        <SubLabel>Dashboard</SubLabel>
        <div className="grid grid-cols-1 lg:grid-cols-[4fr_8fr] gap-3">
          {/* Left: comparison table + maintenance */}
          <div className="flex flex-col gap-2">
            <KpiCompareTable
              rows={[
                {
                  label: "Peso",
                  current: bwDelta.currentAvg,
                  previous: bwDelta.previousAvg,
                  delta: bwDelta.deltaGr,
                  unit: "kg",
                  deltaUnit: "g",
                  decimals: 1,
                  deltaThreshold: 100,
                },
                {
                  label: "Calorías",
                  current: calDelta.lastWeekAvg,
                  previous: calDelta.prevWeekAvg,
                  delta: calDelta.delta,
                  unit: "kcal",
                  deltaUnit: "kcal",
                  deltaThreshold: 50,
                },
              ]}
            />
            <KpiSingle
              label="Mantenimiento sistema"
              value={maintenanceKcal != null ? fmtNum(maintenanceKcal) : "—"}
              unit="kcal"
              sub="estimado por regresión MA7 + intake"
            />
          </div>

          {/* Right: weekly chart */}
          <div className="rounded-xl p-3 flex flex-col" style={{ background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.07)", minHeight: 280 }}>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/75 uppercase mb-2" style={{ fontFamily: JAKARTA }}>Promedio semanal — peso y calorías</p>
            <div className="flex-1 -mx-1 -mb-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -14 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={axisStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar yAxisId="right" dataKey="Kcal prom" fill="rgba(255,255,255,0.12)" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="left" type="monotone" dataKey="Peso prom" stroke="#6ee7a0" strokeWidth={2.5} dot={{ fill: "#6ee7a0", r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── PARTE 2: OBJETIVO ── */}
      <div>
        <SubLabel>Objetivo</SubLabel>

        {/* Mode selector */}
        <div className="flex gap-1.5 mb-4">
          {(["cut", "maintenance", "bulk"] as const).map(m => (
            <button
              key={m}
              onClick={() => isCoach && setMode(m)}
              className="flex-1 py-2 rounded-xl text-[11px] font-semibold tracking-[0.08em] uppercase transition-all"
              style={{
                fontFamily: JAKARTA,
                color: mode === m ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                background: mode === m ? "hsla(0,0%,100%,0.13)" : "hsla(0,0%,100%,0.04)",
                border: "1px solid " + (mode === m ? "hsla(0,0%,100%,0.22)" : "hsla(0,0%,100%,0.07)"),
                cursor: isCoach ? "pointer" : "default",
              }}
            >
              {m === "cut" ? "Déficit" : m === "maintenance" ? "Mantenimiento" : "Superávit"}
            </button>
          ))}
        </div>

        {/* Section 1: Peso objetivo */}
        <p className="text-[9px] font-semibold tracking-[0.18em] text-white/30 uppercase mb-2" style={{ fontFamily: JAKARTA }}>Peso objetivo</p>

        {/* Start weight row (full width) */}
        <div className="rounded-xl p-2.5 mb-2" style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <FieldLabel>Peso de inicio</FieldLabel>
            <MiniToggle<AutoManual>
              options={['auto', 'manual']}
              value={startWeightMode}
              onChange={setStartWeightMode}
              disabled={!isCoach}
            />
          </div>
          {startWeightMode === 'auto' ? (
            <div className="flex items-center gap-2">
              <div style={{ ...inputStyle, padding: "6px 10px", color: autoStartWeight != null ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>
                {autoStartWeight != null ? `${autoStartWeight.toFixed(1)} kg` : "Sin datos"}
              </div>
              <span className="text-[9px] text-white/30" style={{ fontFamily: JAKARTA }}>último registro</span>
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="78.0"
                value={startWeightManual}
                readOnly={!isCoach}
                onChange={e => setStartWeightManual(e.target.value)}
                style={{ ...inputStyle, paddingRight: 30, opacity: isCoach ? 1 : 0.55 }}
                onFocus={e => isCoach && (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.35)")}
                onBlur={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.12)")}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/35 pointer-events-none" style={{ fontFamily: JAKARTA }}>kg</span>
            </div>
          )}
        </div>

        {/* Row 1: peso/rate/date triangle */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Cell
            label="Peso objetivo"
            value={targetWeight}
            onChange={setTargetWeight}
            unit="kg"
            placeholder="75"
            readOnly={!isCoach}
          />
          <Cell
            label={rateLabel}
            value={isMaintenance ? "—" : ratePerWeek}
            onChange={(v) => {
              if (isMaintenance) return;
              setRatePerWeek(applySign(v, mode));
              setTriangleComputed('date');
              setAdjLocked(false); // rate edit → adj recomputes
            }}
            unit={isMaintenance ? "" : "kg/sem"}
            placeholder={isMaintenance ? "" : (mode === 'cut' ? "0.5" : "0.3")}
            readOnly={!isCoach || isMaintenance}
            highlightColor={triangleComputed === 'rate' ? "#fcd34d" : undefined}
            computed={triangleComputed === 'rate' ? "computado" : undefined}
          />
          <DateCell
            label="Fecha objetivo"
            value={targetDate}
            onChange={(v) => {
              setTargetDate(v);
              setTriangleComputed('rate');
              setAdjLocked(false);
            }}
            readOnly={!isCoach}
            computed={triangleComputed === 'date' ? "computado" : undefined}
          />
        </div>

        {/* Row 2: maintenance / adj / balance */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="rounded-xl p-2.5" style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel>Mantenimiento</FieldLabel>
              <MiniToggle<AutoManual>
                options={['auto', 'manual']}
                value={maintenanceMode}
                onChange={setMaintenanceMode}
                disabled={!isCoach}
              />
            </div>
            {maintenanceMode === 'auto' ? (
              <div style={{ ...inputStyle, padding: "6px 10px", color: maintenanceKcal != null ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>
                {maintenanceKcal != null ? `${fmtNum(maintenanceKcal)} kcal` : "Sin datos"}
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  placeholder="2400"
                  value={maintenanceManual}
                  readOnly={!isCoach}
                  onChange={e => setMaintenanceManual(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 36 }}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/35 pointer-events-none" style={{ fontFamily: JAKARTA }}>kcal</span>
              </div>
            )}
          </div>
          <Cell
            label={adjLabel}
            value={isMaintenance ? "0" : kcalAdjPerDay}
            onChange={(v) => {
              if (isMaintenance) return;
              const signed = applySign(v, mode);
              setAdjLocked(true);
              setKcalAdjPerDay(signed);
              const adj = parseFloat(signed);
              if (!isNaN(adj)) {
                setRatePerWeek(applySign(kcalDayToKgWeek(adj).toString(), mode));
                setTriangleComputed('date');
              }
            }}
            unit={isMaintenance ? "" : "kcal/d"}
            placeholder={isMaintenance ? "" : (mode === 'cut' ? "550" : "300")}
            readOnly={!isCoach || isMaintenance}
          />
          <div className="rounded-xl p-2.5" style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
            <FieldLabel>Balance kcal</FieldLabel>
            <div style={{ ...inputStyle, padding: "6px 10px", color: effectiveBalance != null ? "#6ee7a0" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>
              {effectiveBalance != null ? `${fmtNum(effectiveBalance)} kcal` : "—"}
            </div>
            <p className="mt-1 text-[9px] text-white/40" style={{ fontFamily: JAKARTA }}>= mant + ajuste</p>
          </div>
        </div>

        {/* Section 2: Macronutrientes y actividad */}
        <p className="text-[9px] font-semibold tracking-[0.18em] text-white/30 uppercase mb-2 mt-5" style={{ fontFamily: JAKARTA }}>Macronutrientes y actividad</p>

        {/* Row 3: macros */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Cell
            label="Proteína"
            value={proteinValue}
            onChange={setProteinValue}
            unit={proteinUnit === 'gkg' ? 'g/kg' : '%'}
            placeholder={proteinUnit === 'gkg' ? '2.0' : '30'}
            readOnly={!isCoach}
            toggle={<MiniToggle<MacroUnit> options={['gkg', 'pct']} value={proteinUnit} onChange={switchProteinUnit} disabled={!isCoach} />}
            computed={proteinDerived.grams != null
              ? `${proteinDerived.grams} g · ${proteinUnit === 'gkg' ? (proteinDerived.pct ?? 0) + '%' : (proteinDerived.perKg ?? 0) + ' g/kg'}`
              : undefined}
          />
          <Cell
            label="Grasas"
            value={fatValue}
            onChange={setFatValue}
            unit={fatUnit === 'gkg' ? 'g/kg' : '%'}
            placeholder={fatUnit === 'gkg' ? '0.9' : '25'}
            readOnly={!isCoach}
            toggle={<MiniToggle<MacroUnit> options={['gkg', 'pct']} value={fatUnit} onChange={switchFatUnit} disabled={!isCoach} />}
            computed={fatDerived.grams != null
              ? `${fatDerived.grams} g · ${fatUnit === 'gkg' ? (fatDerived.pct ?? 0) + '%' : (fatDerived.perKg ?? 0) + ' g/kg'}`
              : undefined}
          />
          <Cell
            label="Carbos"
            value={carbsValue}
            onChange={setCarbsValue}
            unit={carbsUnit === 'gkg' ? 'g/kg' : '%'}
            placeholder={carbsUnit === 'gkg' ? '3.0' : '45'}
            readOnly={!isCoach}
            toggle={<MiniToggle<MacroUnit> options={['gkg', 'pct']} value={carbsUnit} onChange={switchCarbsUnit} disabled={!isCoach} />}
            computed={carbsDerived.grams != null
              ? `${carbsDerived.grams} g · ${carbsUnit === 'gkg' ? (carbsDerived.pct ?? 0) + '%' : (carbsDerived.perKg ?? 0) + ' g/kg'}`
              : undefined}
          />
        </div>

        {/* Row 4: fiber/cardio/steps */}
        <div className="grid grid-cols-3 gap-2">
          <Cell
            label="Fibra"
            value={fiberTarget}
            onChange={setFiberTarget}
            unit="g"
            placeholder="25"
            readOnly={!isCoach}
          />
          <Cell
            label="Cardio"
            value={cardioTarget}
            onChange={setCardioTarget}
            unit="min/d"
            placeholder="30"
            readOnly={!isCoach}
          />
          <Cell
            label="Pasos"
            value={stepsTarget}
            onChange={setStepsTarget}
            placeholder="8000"
            readOnly={!isCoach}
          />
        </div>

        {/* Macro total check */}
        {macroKcalDelta != null && Math.abs(macroKcalDelta) > 50 && (
          <p className="mt-2 text-[10px]" style={{ fontFamily: JAKARTA, color: "#fcd34d" }}>
            ⚠ Macros suman {fmtNum(totalMacroKcal)} kcal (diferencia de {macroKcalDelta > 0 ? '+' : ''}{fmtNum(macroKcalDelta)} kcal vs balance)
          </p>
        )}
      </div>

      {/* ── Nota para el atleta ── */}
      <div className="rounded-xl p-2.5" style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
        <FieldLabel>Nota para el atleta (opcional)</FieldLabel>
        <textarea
          rows={2}
          placeholder="Ej: ajuste por semana de descarga…"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{
            ...inputStyle,
            resize: "none",
            lineHeight: "1.5",
            padding: "6px 10px",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.35)")}
          onBlur={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.12)")}
        />
      </div>

      {/* ── Save / lock ── */}
      {isCoach ? (
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-semibold text-white disabled:opacity-50"
            style={{
              fontFamily: JAKARTA,
              background: "linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)",
              border: "1.5px solid hsla(0,0%,100%,0.35)",
              boxShadow: "0 4px 12px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.3)",
            }}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Guardando..." : "Guardar goals"}
          </motion.button>
          {saveMsg && (
            <span className={`text-[11px] ${saveMsg.startsWith("Error") ? "text-[#fca5a5]" : "text-[#6ee7a0]"}`} style={{ fontFamily: JAKARTA }}>
              {saveMsg}
            </span>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-white/30 flex items-center gap-1.5" style={{ fontFamily: JAKARTA }}>
          <Lock className="w-3 h-3" /> Solo el coach puede modificar estos valores.
        </p>
      )}

      {/* History */}
      <div>
        <button
          onClick={showHistory ? () => setShowHistory(false) : loadHistory}
          className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/60 transition-colors"
          style={{ fontFamily: JAKARTA }}
        >
          <History className="w-3 h-3" />
          {showHistory ? "Ocultar historial" : "Ver historial de cambios"}
          <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              {histLoading && <p className="text-[11px] text-white/40" style={{ fontFamily: JAKARTA }}>Cargando...</p>}
              {!histLoading && history.length === 0 && (
                <p className="text-[11px] text-white/35" style={{ fontFamily: JAKARTA }}>Sin historial aún.</p>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((h, i) => (
                  <div key={i} className="rounded-xl p-3 text-[11px]" style={{ background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", fontFamily: JAKARTA }}>
                    <div className="flex justify-between text-white/50 mb-1">
                      <span>{new Date(h.changedAt).toLocaleString("es-AR")}</span>
                      <span className="text-white/30">{h.changedBy}</span>
                    </div>
                    <div className="text-white/70">
                      Modo: {h.snapshot.mode} · Kcal: {h.snapshot.kcalTarget ?? "—"} · Prot: {h.snapshot.proteinTarget ?? "—"}g
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
