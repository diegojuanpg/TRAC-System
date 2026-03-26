import { type StepDefinition } from "@/data/surveySteps";
import { useEffect, useRef } from "react";

interface NumberStepProps {
  step: StepDefinition;
  value: string | number | undefined;
  onChange: (value: number) => void;
}

export const NumberStep = ({ step, value, onChange }: NumberStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, [step.id]);

  return (
    <div className="w-full max-w-[260px]">
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl py-5 text-center text-5xl font-light text-foreground/90 outline-none transition-colors duration-200 focus:border-white/[0.15] placeholder:text-muted-foreground/20"
        placeholder={step.placeholder}
        min={step.min}
        max={step.max}
        value={value ?? ''}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          if (!isNaN(num)) onChange(num);
        }}
      />
      {step.unit && (
        <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground/50 text-center mt-3 uppercase">
          {step.unit}
        </div>
      )}
    </div>
  );
};
