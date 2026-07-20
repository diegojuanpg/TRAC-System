import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Pencil, X } from "lucide-react";
import {
  NutritionRow,
  todayLocalISO,
  addDays,
  buildBodyweightRawRows,
  buildBodyweightWeeklyRows,
  BwWeeklyDayRow,
} from "@/lib/nutritionMath";
import { saveNutritionEntry } from "@/lib/nutritionApi";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
  { label: "6m", days: 180 },
  { label: "1a", days: 365 },
  { label: "Todo", days: 3650 },
];

type Tab = "historial" | "semanal";

interface Props {
  open: boolean;
  rows: NutritionRow[];
  onClose: () => void;
  saveContext: { athleteId: string | null };
  onSaved: () => void;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const fmtDelta = (v: number | null) => {
  if (v === null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}`;
};

const deltaColor = (v: number | null) => {
  if (v === null || v === 0) return "rgba(255,255,255,0.45)";
  // Gain (weight up) green · loss (weight down) red
  return v > 0 ? "#6ee7a0" : "#fca5a5";
};

function groupByWeek(rows: BwWeeklyDayRow[]): { weekStart: string; weekIndex: number; days: BwWeeklyDayRow[] }[] {
  const map = new Map<string, BwWeeklyDayRow[]>();
  for (const r of rows) {
    const list = map.get(r.weekStart) ?? [];
    list.push(r);
    map.set(r.weekStart, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, days], i) => ({ weekStart, weekIndex: i + 1, days }));
}

const thStyle: React.CSSProperties = {
  fontFamily: JAKARTA,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid hsla(0,0%,100%,0.1)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  fontFamily: JAKARTA,
  fontSize: 12,
  color: "rgba(255,255,255,0.85)",
  padding: "8px 10px",
  borderBottom: "1px solid hsla(0,0%,100%,0.06)",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

function parseWeight(raw: string): number | null | "invalid" {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  const n = parseFloat(t);
  if (!isFinite(n) || n <= 0 || n > 400) return "invalid";
  return Math.round(n * 100) / 100;
}

type CellStatus = "idle" | "saving" | "saved" | "error";

interface EditableBwProps {
  date: string;
  value: number | null;
  saveContext: { athleteId: string | null };
  onSaved: () => void;
  align?: "left" | "right";
}

const EditableBwCell = ({ date, value, saveContext, onSaved, align = "right" }: EditableBwProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<CellStatus>("idle");
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  // Prevent blur-from-button-click race: ignore blur when clicking Guardar/Cancelar
  const ignoreBlurRef = useRef(false);

  useEffect(() => {
    if (editing) {
      const t = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(t);
    }
  }, [editing]);

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 1400);
    return () => clearTimeout(t);
  }, [status]);

  const startEdit = (e?: React.MouseEvent | React.PointerEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (status === "saving") return;
    setDraft(value != null ? String(value) : "");
    setErr("");
    setStatus("idle");
    setEditing(true);
  };

  const cancel = () => {
    ignoreBlurRef.current = false;
    setEditing(false);
    setErr("");
    setStatus("idle");
  };

  const commit = async () => {
    if (savingRef.current) return;
    const parsed = parseWeight(draft);
    if (parsed === "invalid") {
      setErr("Peso inválido (0–400)");
      setStatus("error");
      inputRef.current?.focus();
      return;
    }

    const same =
      (parsed === null && value === null) ||
      (parsed !== null && value !== null && Math.abs(parsed - value) < 0.001);
    if (same) {
      setEditing(false);
      setStatus("idle");
      return;
    }

    if (!saveContext.athleteId) {
      setErr("Sin atleta seleccionado");
      setStatus("error");
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    setErr("");
    try {
      await saveNutritionEntry(saveContext, { bodyweight: parsed }, date);
      setEditing(false);
      setStatus("saved");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al guardar");
      setStatus("error");
      inputRef.current?.focus();
    } finally {
      savingRef.current = false;
    }
  };

  if (editing) {
    return (
      <div
        className="flex flex-col items-end gap-1 min-w-[108px]"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={400}
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            onBlur={() => {
              if (ignoreBlurRef.current) {
                ignoreBlurRef.current = false;
                return;
              }
              // Small delay so Guardar/Cancelar mousedown can set ignoreBlurRef
              window.setTimeout(() => {
                if (ignoreBlurRef.current || savingRef.current) return;
                // Don't auto-save empty→null by accident on blur; only save if changed to a number
                const parsed = parseWeight(draft);
                if (parsed === "invalid") return;
                if (parsed === null && value === null) {
                  cancel();
                  return;
                }
                void commit();
              }, 120);
            }}
            disabled={status === "saving"}
            aria-label={`Peso del ${fmtDate(date)}`}
            className="w-[76px] rounded-lg px-2 py-1.5 text-right text-[13px] outline-none"
            style={{
              fontFamily: JAKARTA,
              fontVariantNumeric: "tabular-nums",
              color: "rgba(255,255,255,0.95)",
              background: "hsla(0,0%,100%,0.1)",
              border: `1px solid ${status === "error" ? "hsla(0,80%,70%,0.55)" : "hsla(110,60%,60%,0.45)"}`,
            }}
          />
          <button
            type="button"
            title="Guardar"
            disabled={status === "saving"}
            onPointerDown={() => { ignoreBlurRef.current = true; }}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              void commit();
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6ee7a0] hover:bg-white/10 transition-colors disabled:opacity-40"
            style={{ border: "1px solid hsla(0,0%,100%,0.12)" }}
          >
            {status === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            title="Cancelar"
            disabled={status === "saving"}
            onPointerDown={() => { ignoreBlurRef.current = true; }}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              cancel();
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            style={{ border: "1px solid hsla(0,0%,100%,0.12)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {status === "error" && err && (
          <span className="text-[9px] text-[#fca5a5] max-w-[140px] text-right leading-tight" style={{ fontFamily: JAKARTA }}>
            {err}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      onPointerDown={e => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 -mx-1 min-h-[36px] transition-colors hover:bg-white/[0.08] active:bg-white/[0.12]"
      style={{
        fontFamily: JAKARTA,
        fontVariantNumeric: "tabular-nums",
        fontSize: 13,
        color: value != null ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.35)",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        width: "100%",
        textAlign: align,
        border: "1px solid transparent",
      }}
      title="Editar peso"
      aria-label={`Editar peso del ${fmtDate(date)}`}
    >
      <span className="underline decoration-white/20 underline-offset-2">
        {value != null ? value.toFixed(2) : "—"}
      </span>
      {status === "saved" ? (
        <Check className="w-3.5 h-3.5 text-[#6ee7a0] shrink-0" />
      ) : (
        <Pencil className="w-3 h-3 text-white/40 shrink-0" />
      )}
    </button>
  );
};

export const WeightDataTablesModal = ({ open, rows, onClose, saveContext, onSaved }: Props) => {
  const [tab, setTab] = useState<Tab>("historial");
  const [rangeDays, setRangeDays] = useState(30);

  const today = todayLocalISO();
  const fromISO = addDays(today, -(rangeDays - 1));

  const rawRows = useMemo(() => {
    const all = buildBodyweightRawRows(rows);
    return all.filter(r => r.date >= fromISO && r.date <= today).slice().reverse();
  }, [rows, fromISO, today]);

  const weeklyRows = useMemo(
    () => buildBodyweightWeeklyRows(rows, fromISO, today),
    [rows, fromISO, today],
  );

  const weekGroups = useMemo(() => groupByWeek(weeklyRows), [weeklyRows]);

  return (
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
            className="fixed inset-x-3 top-4 bottom-4 z-50 max-w-3xl mx-auto flex flex-col"
            style={{ borderRadius: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="relative flex flex-col h-full min-h-0 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsla(0,0%,100%,0.13) 0%, hsla(0,0%,100%,0.05) 55%, hsla(0,0%,100%,0.09) 100%)",
                backdropFilter: "blur(44px) saturate(170%)",
                WebkitBackdropFilter: "blur(44px) saturate(170%)",
                border: "1px solid hsla(0,0%,100%,0.2)",
                boxShadow: "0 24px 70px -10px hsla(0,0%,0%,0.7), inset 0 1px 0 hsla(0,0%,100%,0.3)",
                borderRadius: 28,
              }}
            >
              <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.55), transparent)" }} />

              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-white/50 uppercase" style={{ fontFamily: JAKARTA }}>
                    Tabla de datos
                  </p>
                  <h2 className="text-[22px] font-semibold text-white mt-1 leading-none" style={{ fontFamily: OUTFIT, letterSpacing: "-0.02em" }}>
                    Peso corporal
                  </h2>
                  <p className="text-[10px] text-white/35 mt-1.5" style={{ fontFamily: JAKARTA }}>
                    Tocá el lápiz / el número para editar. Guardá con ✓ o Enter · cancelá con ✕ o Esc.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/45 hover:text-white transition-colors shrink-0"
                  style={{ background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)" }}
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div className="flex gap-1 p-0.5 rounded-full" style={{ background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)" }}>
                  {([
                    { id: "historial" as const, label: "Historial" },
                    { id: "semanal" as const, label: "Semanal" },
                  ]).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                      style={{
                        fontFamily: JAKARTA,
                        color: tab === t.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                        background: tab === t.id ? "hsla(0,0%,100%,0.14)" : "transparent",
                        border: "1px solid " + (tab === t.id ? "hsla(0,0%,100%,0.2)" : "transparent"),
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {RANGES.map(r => (
                    <button
                      key={r.days}
                      onClick={() => setRangeDays(r.days)}
                      className="px-2 py-1.5 rounded-full text-[9px] font-semibold tracking-[0.08em] transition-all min-h-[32px]"
                      style={{
                        fontFamily: JAKARTA,
                        color: rangeDays === r.days ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                        background: rangeDays === r.days ? "hsla(0,0%,100%,0.13)" : "transparent",
                        border: "1px solid " + (rangeDays === r.days ? "hsla(0,0%,100%,0.2)" : "transparent"),
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "semanal" && (
                <p className="px-5 pb-2 text-[10px] text-white/35 shrink-0" style={{ fontFamily: JAKARTA }}>
                  Δ día = promedio de esta semana (hasta ese día) − promedio de la semana pasada (lun–dom). En celdas vacías podés cargar un peso nuevo.
                </p>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 pb-5">
                {tab === "historial" ? (
                  rawRows.length === 0 ? (
                    <EmptyState text="Sin mediciones de peso en este rango. Usá la pestaña Semanal para cargar un día vacío." />
                  ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid hsla(0,0%,100%,0.1)", background: "hsla(0,0%,0%,0.2)" }}>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th style={thStyle}>Fecha</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>Peso</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>MA7</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rawRows.map(r => (
                            <tr key={r.date}>
                              <td style={tdStyle}>{fmtDate(r.date)}</td>
                              <td style={{ ...tdStyle, textAlign: "right", paddingTop: 4, paddingBottom: 4 }}>
                                <EditableBwCell
                                  date={r.date}
                                  value={r.bodyweight}
                                  saveContext={saveContext}
                                  onSaved={onSaved}
                                />
                              </td>
                              <td style={{ ...tdStyle, textAlign: "right", color: "rgba(110,231,160,0.9)" }}>
                                {r.ma7 != null ? r.ma7.toFixed(2) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : weekGroups.length === 0 ? (
                  <EmptyState text="Sin días en este rango." />
                ) : (
                  <div className="space-y-4">
                    {weekGroups.map(g => (
                      <div key={g.weekStart} className="rounded-2xl overflow-hidden" style={{ border: "1px solid hsla(0,0%,100%,0.1)", background: "hsla(0,0%,0%,0.2)" }}>
                        <div
                          className="px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-white/50"
                          style={{ fontFamily: JAKARTA, borderBottom: "1px solid hsla(0,0%,100%,0.08)", background: "hsla(0,0%,100%,0.03)" }}
                        >
                          Semana {g.weekIndex} — {fmtDate(g.weekStart)} · días {g.days[0]?.day ?? 1}–{g.days[g.days.length - 1]?.day ?? 7}
                        </div>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th style={thStyle}>Fecha</th>
                              <th style={{ ...thStyle, textAlign: "center" }}>Día</th>
                              <th style={{ ...thStyle, textAlign: "right" }}>BW</th>
                              <th style={{ ...thStyle, textAlign: "right" }}>Δ día</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.days.map(r => (
                              <tr key={r.date}>
                                <td style={tdStyle}>{fmtDate(r.date)}</td>
                                <td style={{ ...tdStyle, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>{r.day}</td>
                                <td style={{ ...tdStyle, textAlign: "right", paddingTop: 4, paddingBottom: 4 }}>
                                  <EditableBwCell
                                    date={r.date}
                                    value={r.bodyweight}
                                    saveContext={saveContext}
                                    onSaved={onSaved}
                                  />
                                </td>
                                <td style={{ ...tdStyle, textAlign: "right", color: deltaColor(r.deltaDia) }}>
                                  {fmtDelta(r.deltaDia)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid hsla(0,0%,100%,0.08)", background: "hsla(0,0%,0%,0.15)" }}>
    <p className="text-[12px] text-white/40" style={{ fontFamily: JAKARTA }}>{text}</p>
  </div>
);
