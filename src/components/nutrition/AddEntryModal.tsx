import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Flame, Beef, Wheat, Droplets, Leaf, Footprints, Bike, Weight } from "lucide-react";
import { saveNutritionEntry } from "@/lib/nutritionApi";
import { useUser } from "@/context/UserContext";
import { todayLocalISO } from "@/lib/nutritionMath";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface EntryData {
  date: string;
  bodyweight: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  water: string;
  steps: string;
  cardio: string;
}

const empty = (date = todayLocalISO()): EntryData => ({
  date, bodyweight: "", calories: "", protein: "", carbs: "",
  fat: "", fiber: "", water: "", steps: "", cardio: "",
});

function isEditableDate(dateISO: string): boolean {
  const today = todayLocalISO();
  return dateISO === today;
}

interface Props {
  open: boolean;
  prefillDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

const glassInput = {
  background: "hsla(0,0%,100%,0.05)",
  border: "1px solid hsla(0,0%,100%,0.12)",
  borderRadius: 12,
  color: "rgba(255,255,255,0.9)",
  fontFamily: JAKARTA,
  fontSize: 13,
  outline: "none",
} as const;

const FieldRow = ({
  icon, label, sub, name, value, onChange, placeholder, type = "number", wide = false,
}: {
  icon: React.ReactNode; label: string; sub?: string;
  name: keyof EntryData; value: string; onChange: (k: keyof EntryData, v: string) => void;
  placeholder: string; type?: string; wide?: boolean;
}) => (
  <div className="flex items-center gap-3 py-2.5">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white/70"
      style={{ background: "linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)", border: "1px solid hsla(0,0%,100%,0.15)", boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.2)" }}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-[13px] font-semibold text-white/90 block" style={{ fontFamily: JAKARTA }}>{label}</span>
      {sub && <span className="text-[10px] text-white/40" style={{ fontFamily: JAKARTA }}>{sub}</span>}
    </div>
    <input
      type={type}
      step={type === "number" ? "any" : undefined}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(name, e.target.value)}
      className={wide ? "w-36" : "w-24"}
      style={{ ...glassInput, textAlign: wide ? "left" : "right", padding: "7px 10px" }}
      onFocus={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.35)")}
      onBlur={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.12)")}
    />
  </div>
);

export const AddEntryModal = ({ open, prefillDate, onClose, onSaved }: Props) => {
  const { user } = useUser();
  const [data, setData] = useState<EntryData>(() => empty(prefillDate));
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const update = (k: keyof EntryData, v: string) => setData(prev => ({ ...prev, [k]: v }));

  // Reset when opening
  const handleOpen = () => {
    setData(empty(prefillDate ?? todayLocalISO()));
    setStatus("idle");
    setErrMsg("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setStatus("saving");
    try {
      const numOrNull = (v: string) => v === "" ? null : parseFloat(v) || null;
      const payload: Record<string, number | string | null> = {
        bodyweight: numOrNull(data.bodyweight),
        calories: numOrNull(data.calories),
        protein: numOrNull(data.protein),
        carbs: numOrNull(data.carbs),
        fat: numOrNull(data.fat),
        fiber: numOrNull(data.fiber),
        water: numOrNull(data.water),
        steps: numOrNull(data.steps),
        cardio: data.cardio || null,
      };
      await saveNutritionEntry(user, payload, data.date);
      setStatus("success");
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Error desconocido.");
      setStatus("error");
    }
  };

  const section = (title: string, children: React.ReactNode) => (
    <div className="relative rounded-2xl p-4"
      style={{ background: "linear-gradient(135deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 100%)", border: "1px solid hsla(0,0%,100%,0.1)", boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.15)" }}>
      <div aria-hidden className="absolute inset-x-3 top-0 h-px opacity-50" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.5), transparent)" }} />
      <div className="text-[10px] font-semibold tracking-[0.18em] text-white/50 uppercase mb-3 pb-2.5 border-b border-white/[0.07]" style={{ fontFamily: JAKARTA }}>{title}</div>
      {children}
    </div>
  );

  return (
    <AnimatePresence onExitComplete={handleOpen}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "hsla(0,0%,0%,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-6 bottom-6 z-50 max-w-lg mx-auto overflow-y-auto"
            style={{ borderRadius: 28 }}
          >
            <div className="relative min-h-full p-6"
              style={{ background: "linear-gradient(135deg, hsla(0,0%,100%,0.13) 0%, hsla(0,0%,100%,0.05) 55%, hsla(0,0%,100%,0.09) 100%)", backdropFilter: "blur(44px) saturate(170%)", WebkitBackdropFilter: "blur(44px) saturate(170%)", border: "1px solid hsla(0,0%,100%,0.2)", boxShadow: "0 24px 70px -10px hsla(0,0%,0%,0.7), inset 0 1px 0 hsla(0,0%,100%,0.3)", borderRadius: 28 }}>
              <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.55), transparent)", borderRadius: "28px 28px 0 0" }} />

              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/55 uppercase mb-1" style={{ fontFamily: JAKARTA }}>Nutrición · TRAC</p>
                  <h2 className="text-[28px] leading-none text-white font-semibold" style={{ fontFamily: OUTFIT, letterSpacing: "-0.025em" }}>Registro diario</h2>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  style={{ background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.12)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Date picker */}
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase mb-1.5" style={{ fontFamily: JAKARTA }}>Fecha</label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={e => update("date", e.target.value)}
                    style={{ ...glassInput, padding: "8px 12px", colorScheme: "dark" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.35)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.12)")}
                  />
                  {!isEditableDate(data.date) && (
                    <p className="text-[10px] text-[#fcd34d] mt-1" style={{ fontFamily: JAKARTA }}>
                      Editando fecha pasada. Solo se permite edición hasta las 00:00 del día siguiente.
                    </p>
                  )}
                </div>

                {section("Cuerpo & Energía", (
                  <>
                    <FieldRow icon={<Weight className="h-5 w-5" />} label="Peso corporal" sub="kg" name="bodyweight" value={data.bodyweight} onChange={update} placeholder="75.5" />
                    <div className="border-t border-white/[0.06]" />
                    <FieldRow icon={<Flame className="h-5 w-5" />} label="Calorías" sub="kcal" name="calories" value={data.calories} onChange={update} placeholder="2000" />
                  </>
                ))}

                {section("Macronutrientes", (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Beef className="h-4 w-4" />, label: "Proteína", name: "protein" as const, unit: "g" },
                      { icon: <Wheat className="h-4 w-4" />, label: "Carbs", name: "carbs" as const, unit: "g" },
                      { icon: <Droplets className="h-4 w-4" />, label: "Grasa", name: "fat" as const, unit: "g" },
                      { icon: <Leaf className="h-4 w-4" />, label: "Fibra", name: "fiber" as const, unit: "g" },
                    ].map(f => (
                      <div key={f.name} className="relative rounded-xl p-3"
                        style={{ background: "linear-gradient(135deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 100%)", border: "1px solid hsla(0,0%,100%,0.1)", boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.15)" }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white/70" style={{ background: "hsla(0,0%,100%,0.07)", border: "1px solid hsla(0,0%,100%,0.12)" }}>
                            {f.icon}
                          </div>
                          <span className="text-[11px] text-white/50" style={{ fontFamily: JAKARTA }}>{f.label}</span>
                        </div>
                        <input
                          type="number" step="any" placeholder="—"
                          value={data[f.name]}
                          onChange={e => update(f.name, e.target.value)}
                          className="w-full bg-transparent text-[20px] font-semibold text-white outline-none placeholder:text-white/20"
                          style={{ fontFamily: OUTFIT, letterSpacing: "-0.01em" }}
                        />
                        <span className="absolute bottom-3 right-3 text-[10px] text-white/30" style={{ fontFamily: JAKARTA }}>{f.unit}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {section("Hidratación & Actividad", (
                  <>
                    <FieldRow icon={<Droplets className="h-5 w-5" />} label="Agua" sub="litros" name="water" value={data.water} onChange={update} placeholder="2.5" />
                    <div className="border-t border-white/[0.06]" />
                    <FieldRow icon={<Footprints className="h-5 w-5" />} label="Pasos" sub="cantidad" name="steps" value={data.steps} onChange={update} placeholder="8000" />
                    <div className="border-t border-white/[0.06]" />
                    <FieldRow icon={<Bike className="h-5 w-5" />} label="Cardio" sub="min" name="cardio" value={data.cardio} onChange={update} placeholder="0" type="text" wide />
                  </>
                ))}

                <motion.button
                  type="submit"
                  disabled={status === "saving" || status === "success"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-3 font-semibold text-[14px] px-6 py-4 rounded-full text-white disabled:opacity-60"
                  style={{ fontFamily: JAKARTA, background: "linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)", border: "1.5px solid hsla(0,0%,100%,0.4)", boxShadow: "0 6px 18px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.35)", letterSpacing: "0.02em" }}
                >
                  <Send className="h-4 w-4" />
                  {status === "saving" ? "Guardando..." : status === "success" ? "¡Guardado!" : "Guardar entrada"}
                </motion.button>

                {status === "error" && (
                  <p className="text-[12px] text-[#fca5a5] text-center" style={{ fontFamily: JAKARTA }}>{errMsg}</p>
                )}
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
