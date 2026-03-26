import { CONTEXT_OPTIONS } from "@/data/surveySteps";
import { cn } from "@/lib/utils";
import { CircleDot, Plane, Zap, Wine, Thermometer, Circle, Bandage, MoreHorizontal, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  'circle-dot': CircleDot,
  'plane': Plane,
  'zap': Zap,
  'wine': Wine,
  'thermometer': Thermometer,
  'circle': Circle,
  'bandage': Bandage,
  'more-horizontal': MoreHorizontal,
};

interface ContextStepProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export const ContextStep = ({ value, onChange }: ContextStepProps) => {
  const selected = value || 'Normal';

  return (
    <div className="w-full max-w-md grid grid-cols-2 gap-1.5">
      {CONTEXT_OPTIONS.map((opt, i) => {
        const Icon = iconMap[opt.icon];
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "bg-white/[0.03] border border-white/[0.06] rounded-lg py-4 px-3 text-center transition-all duration-150 flex flex-col items-center",
              (i === 0 || opt.id === 'Otro') && "col-span-2",
              selected === opt.id
                ? "border-white/[0.15] bg-white/[0.06]"
                : "hover:bg-white/[0.05]"
            )}
          >
            <div className={cn(
              "mb-1.5 transition-colors",
              selected === opt.id ? "text-foreground/90" : "text-muted-foreground/60"
            )}>
              {Icon && <Icon className="h-5 w-5" strokeWidth={1.5} />}
            </div>
            <div className={cn(
              "font-mono text-[10px] font-medium tracking-[0.04em]",
              selected === opt.id ? "text-foreground/90" : "text-muted-foreground/60"
            )}>
              {opt.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
