import { type FormData } from "@/data/surveySteps";
import { STEPS } from "@/data/surveySteps";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send } from "lucide-react";

interface SurveySummaryProps {
  formData: FormData;
  onSubmit: () => void;
  onBack: () => void;
}

export const SurveySummary = ({ formData, onSubmit, onBack }: SurveySummaryProps) => {
  const getDisplayValue = (step: typeof STEPS[0]): string => {
    if (step.type === 'number') {
      const val = formData[step.id];
      return val !== undefined ? `${val} ${step.unit || ''}` : '— Omitido';
    }
    if (step.type === 'scale') {
      const val = formData[step.id] as number;
      if (val === undefined) return '—';
      const opt = step.options?.find(o => o.value === val);
      return opt ? `${val} — ${opt.label}` : `${val}`;
    }
    if (step.type === 'context') {
      return (formData.contexto as string) || 'Normal';
    }
    if (step.type === 'tap') {
      if (formData.tap_total === undefined) return '— Omitido';
      return `${formData.tap_total} taps · var ${formData.tap_variance}ms · ${formData.tap_pauses} pausas`;
    }
    if (step.type === 'ortho') {
      if (formData.hr1 === undefined) return '— Omitido';
      return `HR1:${formData.hr1} HR2:${formData.hr2} HR3:${formData.hr3} HR4:${formData.hr4}`;
    }
    return '—';
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-semibold text-foreground/90 text-center mb-1 tracking-tight">Resumen</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">Revisá antes de confirmar</p>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6 max-h-[50vh] overflow-y-auto">
        {STEPS.map((step) => (
          <div key={step.id} className="flex justify-between items-start py-2.5 border-b border-white/[0.06] last:border-b-0">
            <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground/50 uppercase shrink-0 mr-3 pt-0.5">
              {step.question}
            </span>
            <span className="text-xs text-foreground/70 text-right leading-relaxed">
              {getDisplayValue(step)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={onBack} className="shrink-0 h-12 w-12 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-white transition-all flex items-center justify-center p-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button onClick={onSubmit} className="flex-1 h-12 bg-white text-black hover:bg-neutral-200 hover:scale-[1.01] active:scale-95 transition-all rounded-xl border border-transparent shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2">
          <Send className="h-4 w-4" />
          <span className="font-mono text-xs font-bold tracking-[0.1em] uppercase">Guardar</span>
        </Button>
      </div>
    </div>
  );
};
