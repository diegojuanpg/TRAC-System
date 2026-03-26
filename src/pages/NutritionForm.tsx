import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DarkLayout } from "@/components/DarkLayout";
import { ChevronLeft, Send, Flame, Beef, Wheat, Droplets, Leaf, Footprints, Bike, Weight } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useSubmitToScript } from "@/hooks/useSubmitToScript";

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
      {/* Top nav — same as Morning Survey */}
      <div className="fixed top-0 left-0 right-0 px-5 pt-5 flex items-center justify-between z-40">
        <button onClick={() => navigate('/')} className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground/60 uppercase hover:text-foreground/80 transition-colors">
          TRAC
        </button>
      </div>

      <div className="relative z-10 px-4 py-6 pt-16 max-w-lg mx-auto">
        {/* Compact header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="text-2xl">🍽️</div>
          <div>
            <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase">TRAC · Nutrition</div>
            <h1 className="text-xl font-semibold text-foreground/90 tracking-tight">Registro diario</h1>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bodyweight & Calories first */}
          <Section title="Cuerpo & Energía">
            <FieldRow icon={<Weight className="h-5 w-5" />} label="Peso corporal" sub="kg (opcional)" value={data.bodyweight} onChange={v => update('bodyweight', v)} placeholder="75.5" />
            <div className="border-t border-white/[0.06]" />
            <FieldRow icon={<Flame className="h-5 w-5" />} label="Calorías totales" sub="kcal" value={data.calories} onChange={v => update('calories', v)} placeholder="2000" />
          </Section>

          {/* Macros */}
          <Section title="Macronutrientes">
            <div className="grid grid-cols-2 gap-2.5">
              <MacroCard icon={<Beef className="h-4 w-4" />} label="Proteína" unit="gr" value={data.protein} onChange={v => update('protein', v)} />
              <MacroCard icon={<Wheat className="h-4 w-4" />} label="Carbohidratos" unit="gr" value={data.carbs} onChange={v => update('carbs', v)} />
              <MacroCard icon={<Droplets className="h-4 w-4" />} label="Grasas" unit="gr" value={data.fat} onChange={v => update('fat', v)} />
              <MacroCard icon={<Leaf className="h-4 w-4" />} label="Fibra" unit="gr" value={data.fiber} onChange={v => update('fiber', v)} />
            </div>
          </Section>

          {/* Activity */}
          <Section title="Hidratación & Actividad">
            <FieldRow icon={<Droplets className="h-5 w-5" />} label="Agua" sub="litros" value={data.water} onChange={v => update('water', v)} placeholder="0.0" />
            <div className="border-t border-white/[0.06]" />
            <FieldRow icon={<Footprints className="h-5 w-5" />} label="Pasos" sub="cantidad" value={data.steps} onChange={v => update('steps', v)} placeholder="0" />
            <div className="border-t border-white/[0.06]" />
            <FieldRow icon={<Bike className="h-5 w-5" />} label="Cardio" sub="descripción" value={data.cardio} onChange={v => update('cardio', v)} placeholder="Opcional" type="text" wide />
          </Section>

          <Button
            type="submit"
            variant="submit"
            size="full"
            disabled={status === 'saving'}
          >
            <Send className="h-4 w-4" />
            <span className="font-mono text-xs tracking-[0.06em] uppercase">
              {status === 'saving' ? 'Guardando...' : 'Guardar Nutrición'}
            </span>
          </Button>

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-success/10 border border-success/20 rounded-lg p-3.5 text-center">
              <p className="text-sm text-success">✅ Datos guardados correctamente. ¡Buen trabajo!</p>
            </motion.div>
          )}
        </form>
      </div>
    </DarkLayout>
  );
};

/* ── Section ── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
    <div className="font-mono text-[10px] font-bold tracking-[0.15em] text-muted-foreground/50 uppercase mb-4 pb-2.5 border-b border-white/[0.06]">
      {title}
    </div>
    {children}
  </div>
);

/* ── FieldRow ── */
const FieldRow = ({ icon, label, sub, unit, value, onChange, placeholder, type = 'number', large, wide }: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  large?: boolean;
  wide?: boolean;
}) => (
  <div className="flex items-center gap-3 py-2.5">
    <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-muted-foreground/60">
      {icon}
    </div>
    <div className="flex-1">
      <span className={`font-medium text-foreground/90 block ${large ? 'text-sm' : 'text-sm'}`}>{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground/50">{sub}</span>}
    </div>
    {large ? (
      <div className="flex items-baseline gap-1.5">
        <input
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-28 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-right text-2xl font-bold text-foreground/90 outline-none focus:border-white/[0.15] placeholder:text-muted-foreground/20 transition-colors"
        />
        {unit && <span className="text-[10px] text-muted-foreground/40 font-mono">{unit}</span>}
      </div>
    ) : (
      <input
        type={type}
        placeholder={placeholder}
        maxLength={type === 'text' ? 80 : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${wide ? 'w-36 text-left' : 'w-24 text-right'} bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-medium text-foreground/90 outline-none focus:border-white/[0.15] placeholder:text-muted-foreground/20 transition-colors`}
      />
    )}
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
  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 relative focus-within:border-white/[0.15] transition-colors">
    <div className="flex items-center gap-1.5 mb-1.5">
      <div className="w-6 h-6 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-muted-foreground/60">
        {icon}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <input
      type="number"
      placeholder="—"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent text-xl font-semibold text-foreground/90 outline-none placeholder:text-muted-foreground/20"
    />
    <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/30 font-mono">{unit}</span>
  </div>
);

export default NutritionForm;
