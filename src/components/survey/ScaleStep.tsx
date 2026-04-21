import { type StepDefinition } from "@/data/surveySteps";
import { cn } from "@/lib/utils";

interface ScaleStepProps {
  step: StepDefinition;
  value: number | undefined;
  onChange: (value: number) => void;
}

const severityColors = [
  '142, 71%, 45%', // Green
  '80, 60%, 45%',  // Lime
  '38, 92%, 50%',  // Yellow-Orange
  '25, 95%, 53%',  // Orange
  '0, 72%, 51%',   // Red
];

export const ScaleStep = ({ step, value, onChange }: ScaleStepProps) => {
  if (!step.options) return null;

  return (
    <div className="w-full max-w-md flex flex-col gap-2.5">
      {step.options.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "w-full rounded-xl px-4 py-3.5 flex items-center gap-4 text-left transition-all duration-300 border",
              selected
                ? "shadow-sm scale-[1.02] ring-1"
                : "opacity-80 hover:opacity-100 hover:scale-[1.01]"
            )}
            style={{
              backgroundColor: selected ? `hsla(${severityColors[i]}, 0.15)` : `hsla(${severityColors[i]}, 0.03)`,
              borderColor: selected ? `hsl(${severityColors[i]})` : `hsla(${severityColors[i]}, 0.15)`,
              boxShadow: selected ? `0 0 20px hsla(${severityColors[i]}, 0.15)` : 'none',
              ringColor: `hsl(${severityColors[i]})`
            }}
          >
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-sm font-bold transition-colors",
              selected ? "text-white" : "text-white/50"
            )}
            style={{ backgroundColor: selected ? `hsl(${severityColors[i]})` : `hsla(${severityColors[i]}, 0.15)` }}
            >
              {opt.value}
            </div>
            <span className={cn(
              "text-[15px] leading-snug transition-colors",
              selected ? "text-white font-medium drop-shadow-sm" : "text-white/60"
            )}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
