import { type StepDefinition } from "@/data/surveySteps";
import { cn } from "@/lib/utils";

interface ScaleStepProps {
  step: StepDefinition;
  value: number | undefined;
  onChange: (value: number) => void;
}

const severityColors = [
  'hsl(142 71% 45%)',
  'hsl(80 60% 45%)',
  'hsl(38 92% 50%)',
  'hsl(25 95% 53%)',
  'hsl(0 72% 51%)',
];

export const ScaleStep = ({ step, value, onChange }: ScaleStepProps) => {
  if (!step.options) return null;

  return (
    <div className="w-full max-w-md flex flex-col gap-1.5">
      {step.options.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 flex items-center gap-3 text-left transition-all duration-150 border-l-4",
              selected
                ? "border-white/[0.1] bg-white/[0.05]"
                : "hover:bg-white/[0.05]"
            )}
            style={{
              borderLeftColor: severityColors[i],
            }}
          >
            <span className={cn(
              "font-mono text-xs font-medium w-4 shrink-0 transition-colors",
              selected ? "text-foreground/90" : "text-muted-foreground/50"
            )}>
              {opt.value}
            </span>
            <span className={cn(
              "text-sm leading-snug transition-colors",
              selected ? "text-foreground/90 font-medium" : "text-muted-foreground"
            )}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
