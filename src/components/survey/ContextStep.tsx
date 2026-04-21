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
        const isSelected = selected === opt.id;
        
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "bg-white/[0.02] border border-white/[0.05] rounded-2xl py-4 flex flex-col items-center justify-center transition-all duration-300",
              (i === 0 || opt.id === 'Otro') && "col-span-2",
              isSelected
                ? "bg-white/[0.08] border-white/[0.25] shadow-[0_4px_20px_rgba(255,255,255,0.05)] scale-[1.02]"
                : "hover:bg-white/[0.04] hover:border-white/[0.1] hover:scale-[1.01]"
            )}
          >
            <div className={cn(
              "mb-2.5 transition-colors duration-300",
              isSelected ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/40"
            )}>
              {Icon && <Icon className="h-6 w-6" strokeWidth={isSelected ? 2 : 1.5} />}
            </div>
            <div className={cn(
              "font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-300",
              isSelected ? "text-white font-bold" : "text-white/50 font-medium"
            )}>
              {opt.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
