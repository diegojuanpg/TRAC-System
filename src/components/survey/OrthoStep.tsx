import { type FormData } from "@/data/surveySteps";
import { useEffect, useRef } from "react";

interface OrthoStepProps {
  formData: FormData;
  updateFormData: (key: string, value: number) => void;
}

const fields = [
  { id: 'hr1', label: 'HR1', desc: 'Promedio acostado durante 2m.', placeholder: '60' },
  { id: 'hr2', label: 'HR2', desc: 'Valor mas alto al pararte', placeholder: '80' },
  { id: 'hr3', label: 'HR3', desc: 'Valor mas bajo después del pico', placeholder: '72' },
  { id: 'hr4', label: 'HR4', desc: 'Promedio parado durante 2m.', placeholder: '75' },
];

export const OrthoStep = ({ formData, updateFormData }: OrthoStepProps) => {
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => firstRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-md">
      {/* Protocol */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 mb-4">
        <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-muted-foreground/50 uppercase mb-3">
          PROTOCOLO
        </div>
        {[
          'Acostado durante 2m medirás la FC. El promedio será HR1.',
          'Levantate lentamente, el valor mas alto que observes al levantarte sera HR2.',
          'Despues del pico el valor mas bajo que observes sera HR3.',
          'Parado durante 2m medirás la FC. El promedio será HR4.',
        ].map((text, i) => (
          <div key={i} className="flex gap-3 items-start mb-2 last:mb-0">
            <span className="font-mono text-[10px] font-medium text-muted-foreground/40 w-4 shrink-0 pt-0.5">{i + 1}</span>
            <span className="text-xs text-muted-foreground leading-relaxed">{text}</span>
          </div>
        ))}
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f, i) => (
          <div key={f.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3.5 text-center focus-within:border-white/[0.15] transition-colors">
            <div className="font-mono text-[9px] font-semibold tracking-[0.18em] text-muted-foreground/50 uppercase mb-1">{f.label}</div>
            <div className="text-[8px] text-muted-foreground/30 mb-2">{f.desc}</div>
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
              }}
              className="w-full bg-transparent border-b border-white/[0.08] py-1.5 text-center text-2xl font-light text-foreground/90 outline-none placeholder:text-muted-foreground/20 focus:border-white/[0.2] transition-colors"
            />
            <div className="font-mono text-[8px] tracking-[0.16em] text-muted-foreground/40 mt-1 uppercase">BPM</div>
          </div>
        ))}
      </div>
    </div>
  );
};
