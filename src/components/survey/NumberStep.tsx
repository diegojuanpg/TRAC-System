import { type StepDefinition } from "@/data/surveySteps";
import { useEffect, useRef } from "react";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

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
        className="w-full rounded-2xl py-5 text-center text-5xl text-white outline-none transition-colors duration-200 placeholder:text-white/25"
        placeholder={step.placeholder}
        min={step.min}
        max={step.max}
        value={value ?? ''}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          if (!isNaN(num)) onChange(num);
        }}
        style={{
          fontFamily: OUTFIT,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.03) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid hsla(0,0%,100%,0.15)',
          boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.2)',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'hsla(0,0%,100%,0.35)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'hsla(0,0%,100%,0.15)')}
      />
      {step.unit && (
        <div
          className="text-[11px] font-semibold tracking-[0.18em] text-white/55 text-center mt-3 uppercase"
          style={{ fontFamily: JAKARTA }}
        >
          {step.unit}
        </div>
      )}
    </div>
  );
};
