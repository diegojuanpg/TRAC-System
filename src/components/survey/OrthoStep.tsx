import { type FormData } from "@/data/surveySteps";
import { useEffect, useRef } from "react";

interface OrthoStepProps {
  formData: FormData;
  updateFormData: (key: string, value: number) => void;
  onSkipToBW?: () => void;
}

const fields = [
  { id: 'hr1', label: 'HR1', desc: 'Promedio acostado durante 2m.', placeholder: '60' },
  { id: 'hr2', label: 'HR2', desc: 'Valor mas alto al pararte', placeholder: '80' },
  { id: 'hr3', label: 'HR3', desc: 'Valor mas bajo después del pico', placeholder: '72' },
  { id: 'hr4', label: 'HR4', desc: 'Promedio parado durante 2m.', placeholder: '75' },
];

export const OrthoStep = ({ formData, updateFormData, onSkipToBW }: OrthoStepProps) => {
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => firstRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-md">
      {/* Protocol Box */}
      <div className="bg-black/20 border border-white/[0.05] rounded-xl p-5 mb-6 w-full text-left relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-white/[0.12]" />
        <div className="font-mono text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase mb-4 pl-2">
          PROTOCOLO
        </div>
        <ol className="space-y-3.5 m-0 p-0 pl-2 list-none">
          {[
            'Acostado por 2 min. Registrar FC promedio (HR1).',
            'Levantarse lento. Registrar FC máxima (HR2).',
            'Tras este pico. Registrar FC mínima (HR3).',
            'Parado por 2 min. Registrar FC promedio (HR4).',
          ].map((text, i) => (
            <li key={i} className="flex gap-3 items-start">
               <span className="flex items-center justify-center bg-white/[0.05] border border-white/[0.08] text-white/70 font-mono text-[10px] rounded w-5 h-5 shrink-0 mt-0.5">{i + 1}</span>
               <span className="text-xs text-muted-foreground/80 leading-relaxed pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {fields.map((f, i) => (
          <div key={f.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center focus-within:bg-white/[0.04] focus-within:border-white/[0.15] transition-colors relative">
            <div className="font-mono text-[11px] font-semibold tracking-[0.15em] text-white/80 uppercase mb-1">{f.label}</div>
            <div className="text-[10px] text-muted-foreground/60 leading-snug mb-3 min-h-[28px] flex items-center justify-center px-1">{f.desc}</div>
            <input
              ref={i === 0 ? firstRef : undefined}
              type="number"
              inputMode="numeric"
              placeholder={f.placeholder}
              min={30}
              max={220}
              value={formData[f.id] ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) updateFormData(f.id, v);
                else if (e.target.value === '') updateFormData(f.id, NaN); // allow clearing
              }}
              className="w-full bg-transparent border-b-2 border-white/[0.05] pb-2 pt-1 text-center text-3xl sm:text-4xl font-light text-foreground/90 outline-none placeholder:text-muted-foreground/10 focus:border-white/[0.25] transition-colors"
            />
            <div className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground/40 mt-2 uppercase">BPM</div>
          </div>
        ))}
      </div>

      {onSkipToBW && (
        <button
          onClick={onSkipToBW}
          className="mt-6 w-full py-3 rounded-lg bg-white/[0.03] border border-white/[0.05] font-mono text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 uppercase hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          Saltar Mediciones (Ir a Peso)
        </button>
      )}
    </div>
  );
};
