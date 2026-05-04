import { type StepDefinition } from "@/data/surveySteps";
import { cn } from "@/lib/utils";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

interface ScaleStepProps {
  step: StepDefinition;
  value: number | undefined;
  onChange: (value: number) => void;
}

// Severity palette — muted, consistent with design system
// index 0 = value 1 (best) → green, index 4 = value 5 (worst) → red
const SEVERITY: { text: string; border: string; bg: string; bgSelected: string; badgeBg: string }[] = [
  {
    text: 'hsla(142,48%,62%,1)',
    border: 'hsla(142,48%,62%,0.35)',
    bg: 'hsla(142,48%,62%,0.05)',
    bgSelected: 'hsla(142,48%,62%,0.12)',
    badgeBg: 'hsla(142,48%,62%,0.2)',
  },
  {
    text: 'hsla(160,45%,64%,1)',
    border: 'hsla(160,45%,64%,0.32)',
    bg: 'hsla(160,45%,64%,0.05)',
    bgSelected: 'hsla(160,45%,64%,0.12)',
    badgeBg: 'hsla(160,45%,64%,0.2)',
  },
  {
    text: 'hsla(45,65%,68%,1)',
    border: 'hsla(45,65%,68%,0.32)',
    bg: 'hsla(45,65%,68%,0.05)',
    bgSelected: 'hsla(45,65%,68%,0.12)',
    badgeBg: 'hsla(45,65%,68%,0.2)',
  },
  {
    text: 'hsla(25,70%,68%,1)',
    border: 'hsla(25,70%,68%,0.32)',
    bg: 'hsla(25,70%,68%,0.05)',
    bgSelected: 'hsla(25,70%,68%,0.12)',
    badgeBg: 'hsla(25,70%,68%,0.2)',
  },
  {
    text: 'hsla(0,58%,68%,1)',
    border: 'hsla(0,58%,68%,0.32)',
    bg: 'hsla(0,58%,68%,0.05)',
    bgSelected: 'hsla(0,58%,68%,0.12)',
    badgeBg: 'hsla(0,58%,68%,0.2)',
  },
];

export const ScaleStep = ({ step, value, onChange }: ScaleStepProps) => {
  if (!step.options) return null;

  const hasExactly5 = step.options.length === 5;

  return (
    <div className="w-full max-w-md flex flex-col gap-2">
      {step.options.map((opt, i) => {
        const selected = value === opt.value;
        // Use severity palette only for 5-option scales
        const sev = hasExactly5 ? SEVERITY[i] : null;

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "w-full rounded-xl px-4 py-3.5 flex items-center gap-4 text-left transition-all duration-200",
              selected ? "scale-[1.015]" : "hover:scale-[1.005]"
            )}
            style={{
              background: selected
                ? (sev ? sev.bgSelected : 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.08) 100%)')
                : (sev ? sev.bg : 'linear-gradient(135deg, hsla(0,0%,100%,0.05) 0%, hsla(0,0%,100%,0.02) 100%)'),
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: selected
                ? `1px solid ${sev ? sev.border : 'hsla(0,0%,100%,0.35)'}`
                : `1px solid ${sev ? sev.border.replace('0.32', '0.12') : 'hsla(0,0%,100%,0.1)'}`,
              boxShadow: selected
                ? `0 4px 20px hsla(0,0%,0%,0.25), inset 0 1px 0 hsla(0,0%,100%,0.2)`
                : 'none',
            }}
          >
            {/* Badge */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[13px]"
              style={{
                fontFamily: OUTFIT,
                fontWeight: 700,
                background: selected
                  ? (sev ? sev.badgeBg : 'hsla(0,0%,100%,0.22)')
                  : 'hsla(0,0%,100%,0.06)',
                border: `1px solid ${selected ? (sev ? sev.border : 'hsla(0,0%,100%,0.4)') : 'hsla(0,0%,100%,0.1)'}`,
                color: selected
                  ? (sev ? sev.text : 'hsla(0,0%,100%,0.95)')
                  : 'hsla(0,0%,100%,0.4)',
              }}
            >
              {opt.value}
            </div>

            <span
              className={cn("text-[14px] leading-snug transition-colors")}
              style={{
                fontFamily: JAKARTA,
                fontWeight: selected ? 500 : 400,
                color: selected
                  ? (sev ? sev.text : 'hsla(0,0%,100%,1)')
                  : 'hsla(0,0%,100%,0.55)',
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
