import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DarkLayout } from "@/components/DarkLayout";
import { GlassCard } from "@/components/GlassCard";
import { ChevronLeft, Send, Flame, Beef, Wheat, Droplets, Leaf, Footprints, Bike, Weight } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSubmitToScript } from "@/hooks/useSubmitToScript";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface NutritionData {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  water: string;
  steps: string;
  cardio: string;
  bodyweight: string;
}

const NutritionForm = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { submit } = useSubmitToScript();
  const [data, setData] = useState<NutritionData>({
    calories: '', protein: '', carbs: '', fat: '',
    fiber: '', water: '', steps: '', cardio: '', bodyweight: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const update = (key: keyof NutritionData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
      await submit({
        email: user?.email ?? 'unknown',
        form_type: 'nutrition',
        data: data as unknown as Record<string, unknown>,
      });
      setStatus('success');
    } catch (err) {
      console.error('Submit error:', err);
      setStatus('error');
    }
  };

  return (
    <DarkLayout>
      {/* Back button */}
      <div className="fixed top-5 left-5 z-40">
        <button
          onClick={() => navigate('/')}
          aria-label="Volver"
          className="flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-colors"
          style={{
            background: 'linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid hsla(0,0%,100%,0.18)',
            boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25)',
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="relative z-10 px-4 py-10 pt-20 max-w-lg mx-auto">
        {/* Glass main container */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard>
            <div className="px-6 py-7 sm:px-8 sm:py-9">
              {/* Header labels */}
              <div className="flex items-center justify-between mb-7">
                <span
                  className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
                  style={{ fontFamily: JAKARTA }}
                >
                  Nutrition
                </span>
                <span
                  className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
                  style={{ fontFamily: JAKARTA }}
                >
                  TRAC
                </span>
              </div>

              {/* Title */}
              <div className="relative inline-block mb-2">
                <div
                  className="absolute inset-0 blur-2xl pointer-events-none"
                  style={{ background: 'hsla(0,0%,100%,0.18)', transform: 'scale(1.15)' }}
                  aria-hidden="true"
                />
                <h1
                  className="relative text-[40px] leading-[1.0] text-white"
                  style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.03em' }}
                >
                  Registro diario
                </h1>
              </div>
              <p
                className="text-[13px] text-white/60 mb-7"
                style={{ fontFamily: JAKARTA }}
              >
                Registra calorías, macros, hidratación y actividad.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Section title="Cuerpo & Energía">
                  <FieldRow icon={<Weight className="h-5 w-5" />} label="Peso corporal" sub="kg (opcional)" value={data.bodyweight} onChange={v => update('bodyweight', v)} placeholder="75.5" />
                  <Divider />
                  <FieldRow icon={<Flame className="h-5 w-5" />} label="Calorías totales" sub="kcal" value={data.calories} onChange={v => update('calories', v)} placeholder="2000" />
                </Section>

                <Section title="Macronutrientes">
                  <div className="grid grid-cols-2 gap-3">
                    <MacroCard icon={<Beef className="h-4 w-4" />} label="Proteína" unit="gr" value={data.protein} onChange={v => update('protein', v)} />
                    <MacroCard icon={<Wheat className="h-4 w-4" />} label="Carbohidratos" unit="gr" value={data.carbs} onChange={v => update('carbs', v)} />
                    <MacroCard icon={<Droplets className="h-4 w-4" />} label="Grasas" unit="gr" value={data.fat} onChange={v => update('fat', v)} />
                    <MacroCard icon={<Leaf className="h-4 w-4" />} label="Fibra" unit="gr" value={data.fiber} onChange={v => update('fiber', v)} />
                  </div>
                </Section>

                <Section title="Hidratación & Actividad">
                  <FieldRow icon={<Droplets className="h-5 w-5" />} label="Agua" sub="litros" value={data.water} onChange={v => update('water', v)} placeholder="0.0" />
                  <Divider />
                  <FieldRow icon={<Footprints className="h-5 w-5" />} label="Pasos" sub="cantidad" value={data.steps} onChange={v => update('steps', v)} placeholder="0" />
                  <Divider />
                  <FieldRow icon={<Bike className="h-5 w-5" />} label="Cardio" sub="descripción" value={data.cardio} onChange={v => update('cardio', v)} placeholder="Opcional" type="text" wide />
                </Section>

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={status === 'saving'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-full relative flex items-center justify-center gap-3 font-semibold text-[14px] px-6 py-4 rounded-full text-white disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                    style={{
                      fontFamily: JAKARTA,
                      background: 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1.5px solid hsla(0,0%,100%,0.4)',
                      boxShadow: '0 6px 18px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.35)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-4 top-0 h-px opacity-70"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.7), transparent)',
                      }}
                    />
                    <Send className="h-4 w-4" />
                    {status === 'saving' ? 'Guardando...' : 'Guardar nutrición'}
                  </motion.button>
                </div>

                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: 'hsla(0,0%,100%,0.06)',
                      border: '1px solid hsla(0,0%,100%,0.18)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <p className="text-[13px] text-white/80" style={{ fontFamily: JAKARTA }}>
                      Datos guardados con éxito.
                    </p>
                  </motion.div>
                )}
              </form>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DarkLayout>
  );
};

/* ── Section ── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    className="relative rounded-2xl overflow-hidden p-4"
    style={{
      background: 'linear-gradient(135deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 100%)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid hsla(0,0%,100%,0.12)',
      boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.18)',
    }}
  >
    <span
      aria-hidden="true"
      className="absolute inset-x-3 top-0 h-px opacity-60"
      style={{
        background:
          'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.5), transparent)',
      }}
    />
    <div
      className="text-[10px] font-semibold tracking-[0.18em] text-white/55 uppercase mb-3 pb-2.5 border-b border-white/[0.08]"
      style={{ fontFamily: JAKARTA }}
    >
      {title}
    </div>
    {children}
  </div>
);

const Divider = () => <div className="border-t border-white/[0.06]" />;

/* ── FieldRow ── */
const FieldRow = ({ icon, label, sub, value, onChange, placeholder, type = 'number', wide }: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  wide?: boolean;
}) => (
  <div className="flex items-center gap-3 py-2.5">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white/75"
      style={{
        background: 'linear-gradient(135deg, hsla(0,0%,100%,0.12) 0%, hsla(0,0%,100%,0.04) 100%)',
        border: '1px solid hsla(0,0%,100%,0.18)',
        boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25)',
      }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <span
        className="text-[13px] font-semibold text-white/90 block"
        style={{ fontFamily: JAKARTA }}
      >
        {label}
      </span>
      {sub && (
        <span className="text-[10px] text-white/45" style={{ fontFamily: JAKARTA }}>
          {sub}
        </span>
      )}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      maxLength={type === 'text' ? 80 : undefined}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${wide ? 'w-36 text-left' : 'w-24 text-right'} rounded-lg px-3 py-2 text-[13px] font-medium text-white outline-none transition-colors placeholder:text-white/25`}
      style={{
        fontFamily: JAKARTA,
        background: 'hsla(0,0%,100%,0.04)',
        border: '1px solid hsla(0,0%,100%,0.1)',
      }}
      onFocus={e => (e.currentTarget.style.borderColor = 'hsla(0,0%,100%,0.3)')}
      onBlur={e => (e.currentTarget.style.borderColor = 'hsla(0,0%,100%,0.1)')}
    />
  </div>
);

/* ── MacroCard ── */
const MacroCard = ({ icon, label, unit, value, onChange }: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div
    className="relative rounded-xl p-3"
    style={{
      background: 'linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.02) 100%)',
      border: '1px solid hsla(0,0%,100%,0.12)',
      boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.18)',
    }}
  >
    <div className="flex items-center gap-1.5 mb-1.5">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-white/75"
        style={{
          background: 'hsla(0,0%,100%,0.08)',
          border: '1px solid hsla(0,0%,100%,0.14)',
        }}
      >
        {icon}
      </div>
      <span
        className="text-[11px] text-white/55"
        style={{ fontFamily: JAKARTA }}
      >
        {label}
      </span>
    </div>
    <input
      type="number"
      placeholder="—"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent text-[20px] font-semibold text-white outline-none placeholder:text-white/20"
      style={{ fontFamily: OUTFIT, letterSpacing: '-0.01em' }}
    />
    <span
      className="absolute bottom-3 right-3 text-[10px] text-white/35"
      style={{ fontFamily: JAKARTA }}
    >
      {unit}
    </span>
  </div>
);

export default NutritionForm;
