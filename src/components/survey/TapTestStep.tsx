import { useState, useRef, useCallback, useEffect } from "react";
import { type FormData } from "@/data/surveySteps";
import { cn } from "@/lib/utils";

interface TapTestStepProps {
  formData: FormData;
  updateFormData: (key: string, value: number) => void;
}

type TapPhase = 'ready' | 'countdown' | 'active' | 'done';

const PAUSE_THRESH = 300;
const TEST_DURATION = 10000;

export const TapTestStep = ({ formData, updateFormData }: TapTestStepProps) => {
  const [phase, setPhase] = useState<TapPhase>(formData.tap_total !== undefined ? 'done' : 'ready');
  const [countdown, setCountdown] = useState(3);
  const [tapCount, setTapCount] = useState(formData.tap_total as number || 0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [variance, setVariance] = useState(formData.tap_variance as number || 0);
  const [pauses, setPauses] = useState(formData.tap_pauses as number || 0);

  const timestampsRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  const calcStats = (timestamps: number[]) => {
    if (timestamps.length < 2) return { variance: 0, pauses: 0 };
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) intervals.push(timestamps[i] - timestamps[i - 1]);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sd = Math.sqrt(intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length);
    const p = intervals.filter(v => v > PAUSE_THRESH).length;
    return { variance: Math.round(sd), pauses: p };
  };

  const endTest = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    const stats = calcStats(timestampsRef.current);
    const total = timestampsRef.current.length;
    setTapCount(total);
    setVariance(stats.variance);
    setPauses(stats.pauses);
    updateFormData('tap_total', total);
    updateFormData('tap_variance', stats.variance);
    updateFormData('tap_pauses', stats.pauses);
    setPhase('done');
  }, [updateFormData]);

  const timerLoop = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    const remaining = Math.max(0, TEST_DURATION - elapsed);
    setTimeLeft(Math.ceil(remaining / 1000));
    if (remaining > 0) {
      frameRef.current = requestAnimationFrame(timerLoop);
    } else {
      endTest();
    }
  }, [endTest]);

  const startActive = useCallback(() => {
    setPhase('active');
    timestampsRef.current = [];
    setTapCount(0);
    startTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(timerLoop);
  }, [timerLoop]);

  const startCountdown = () => {
    setPhase('countdown');
    setCountdown(3);
    let c = 3;
    const iv = setInterval(() => {
      c--;
      if (c > 0) {
        setCountdown(c);
      } else {
        clearInterval(iv);
        setCountdown(0);
        setTimeout(startActive, 500);
      }
    }, 850);
  };

  const handleTap = (e: React.PointerEvent) => {
    e.preventDefault();
    if (phase !== 'active') return;
    const elapsed = performance.now() - startTimeRef.current;
    if (elapsed < 0 || elapsed > TEST_DURATION + 50) return;
    timestampsRef.current.push(performance.now());
    const cnt = timestampsRef.current.length;
    setTapCount(cnt);
    if (cnt >= 2) {
      const stats = calcStats(timestampsRef.current);
      setVariance(stats.variance);
      setPauses(stats.pauses);
    }
  };

  const retry = () => {
    setPhase('ready');
    timestampsRef.current = [];
    setTapCount(0);
    setVariance(0);
    setPauses(0);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const getCnsStatus = () => {
    if (pauses >= 3 || variance > 60) return { color: 'hsl(0 72% 51%)', msg: 'SNC bajo estrés. Sesión técnica o submáxima.' };
    if (pauses >= 1 || variance > 35) return { color: 'hsl(38 92% 50%)', msg: 'SNC moderado. Reducí el RPE objetivo en 1.' };
    return { color: 'hsl(142 71% 45%)', msg: 'SNC fresco. Entrenamiento normal.' };
  };

  return (
    <div className="w-full max-w-sm">
      {phase === 'ready' && (
        <div className="text-center py-6">
          <button
            onClick={startCountdown}
            className="w-44 h-44 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/90 font-mono text-base font-bold tracking-[0.15em] uppercase mx-auto flex items-center justify-center hover:border-white/[0.2] hover:bg-white/[0.06] transition-all active:scale-95 drop-shadow-md"
          >
            TAP<br />INICIAR
          </button>
          <div className="font-mono text-xs font-medium text-muted-foreground/60 tracking-[0.25em] mt-8 uppercase">
            10 segundos · mano dominante
          </div>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="text-center flex flex-col items-center justify-center py-8 relative">
          <div className={cn(
            "text-[8rem] font-black tracking-tighter leading-none transition-all duration-300",
            countdown > 0 
              ? "text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-pulse" 
              : "text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.6)] scale-110"
          )}>
            {countdown > 0 ? countdown : 'GO!'}
          </div>
          <div className="font-mono text-xs text-amber-500/80 tracking-[0.3em] font-semibold mt-4 uppercase animate-pulse">
            Preparate
          </div>
        </div>
      )}

      {phase === 'active' && (
        <div className="text-center">
          <div className="text-[7rem] font-bold text-white leading-none mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform">
            {tapCount}
          </div>
          <div className={cn(
            "font-mono text-xs font-semibold tracking-[0.2em] mb-5 uppercase",
            timeLeft <= 3 ? "text-red-400 animate-pulse" : "text-amber-500/80"
          )}>
            {timeLeft} S
          </div>
          <div
            onPointerDown={handleTap}
            className="w-full h-28 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-center text-lg font-medium tracking-[0.08em] text-foreground/80 cursor-pointer active:bg-white/[0.06] active:border-white/[0.15] select-none touch-none"
          >
            TAP
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <div className="text-lg font-light text-foreground/80">{variance || '—'}</div>
              <div className="font-mono text-[9px] text-muted-foreground/40 tracking-[0.14em] uppercase mt-0.5">varianza ms</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-light text-foreground/80">{pauses}</div>
              <div className="font-mono text-[9px] text-muted-foreground/40 tracking-[0.14em] uppercase mt-0.5">pausas</div>
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (() => {
        const cns = getCnsStatus();
        return (
          <div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'TOTAL TAPS', sub: 'Salida motora global', val: tapCount, unit: 'golpes / 10s' },
                { label: 'VARIANZA', sub: 'Consistencia neural', val: variance, unit: 'ms SD' },
                { label: 'PAUSAS', sub: 'Interrupciones >300ms', val: pauses, unit: 'interrupciones' },
              ].map(r => (
                <div key={r.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[9px] font-medium tracking-[0.16em] text-muted-foreground/50 uppercase">{r.label}</div>
                    <div className="font-mono text-[9px] text-muted-foreground/30">{r.sub}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extralight text-foreground/90">{r.val}</div>
                    <div className="font-mono text-[9px] text-muted-foreground/40">{r.unit}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={retry}
              className="w-full mt-3 h-10 bg-white/[0.03] border border-white/[0.06] rounded-lg font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground/50 hover:border-white/[0.15] hover:text-foreground/70 transition-colors"
            >
              ↻ Repetir test
            </button>
          </div>
        );
      })()}
    </div>
  );
};
