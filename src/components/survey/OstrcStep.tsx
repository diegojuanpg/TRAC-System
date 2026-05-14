import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// OSTRC-H short form (Clarsen et al., BJSM).
// Q1 gatekeeper: any pain/discomfort today? If no → score 0, skip rest.
// Q2: participation (0=full, 8=reduced, 17=can't participate, 25=can't participate at all)
// Q3: volume/training modification (0=none, 6=slight, 13=moderate, 17=full reduction)
// Q4: performance impact (0=none, 8=slight, 17=moderate, 25=severe)
// Q5: symptom severity continuous 0-25
// Total cap: 100.

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

interface Option { value: number; label: string; }

const Q2_OPTIONS: Option[] = [
  { value: 0,  label: 'Sin problemas. Participo completo.' },
  { value: 8,  label: 'Participo pero con molestias.' },
  { value: 17, label: 'Participo con reducción significativa.' },
  { value: 25, label: 'No pude participar.' },
];
const Q3_OPTIONS: Option[] = [
  { value: 0,  label: 'Ninguna modificación.' },
  { value: 6,  label: 'Modificación leve.' },
  { value: 13, label: 'Modificación moderada.' },
  { value: 17, label: 'Modificación severa.' },
];
const Q4_OPTIONS: Option[] = [
  { value: 0,  label: 'Sin impacto en rendimiento.' },
  { value: 8,  label: 'Impacto leve.' },
  { value: 17, label: 'Impacto moderado.' },
  { value: 25, label: 'Impacto severo.' },
];

interface Props {
  value: number | undefined;
  onChange: (v: number) => void;
}

export const OstrcStep = ({ value, onChange }: Props) => {
  const [hasIssue, setHasIssue] = useState<boolean | null>(
    value === undefined ? null : value > 0
  );
  const [q2, setQ2] = useState<number | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [q4, setQ4] = useState<number | null>(null);
  const [q5, setQ5] = useState<number>(0);

  useEffect(() => {
    if (hasIssue === false) { onChange(0); return; }
    if (hasIssue === true) {
      const total = (q2 ?? 0) + (q3 ?? 0) + (q4 ?? 0) + q5;
      onChange(Math.min(total, 100));
    }
  }, [hasIssue, q2, q3, q4, q5, onChange]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Q1 gatekeeper — two big centered pills */}
      <div className="w-full max-w-[320px] grid grid-cols-2 gap-3 mb-6">
        {[
          { val: false, label: 'No' },
          { val: true,  label: 'Sí' },
        ].map(o => {
          const active = hasIssue === o.val;
          return (
            <motion.button
              key={String(o.val)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setHasIssue(o.val)}
              className="py-4 rounded-2xl text-[15px] font-semibold text-white transition-all"
              style={{
                fontFamily: JAKARTA,
                background: active
                  ? 'linear-gradient(135deg, hsla(0,0%,100%,0.22) 0%, hsla(0,0%,100%,0.08) 100%)'
                  : 'hsla(0,0%,100%,0.05)',
                border: active
                  ? '1.5px solid hsla(0,0%,100%,0.5)'
                  : '1px solid hsla(0,0%,100%,0.12)',
                boxShadow: active ? 'inset 0 1px 0 hsla(0,0%,100%,0.3)' : 'none',
              }}
            >
              {o.label}
            </motion.button>
          );
        })}
      </div>

      {hasIssue && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full space-y-5"
        >
          <OstrcGroup
            title="Participación en entrenamiento"
            value={q2}
            onChange={setQ2}
            options={Q2_OPTIONS}
          />
          <OstrcGroup
            title="Modificación de volumen / intensidad"
            value={q3}
            onChange={setQ3}
            options={Q3_OPTIONS}
          />
          <OstrcGroup
            title="Impacto en rendimiento"
            value={q4}
            onChange={setQ4}
            options={Q4_OPTIONS}
          />

          <div className="text-center">
            <p className="text-[11px] tracking-[0.16em] text-white/55 uppercase mb-3" style={{ fontFamily: JAKARTA }}>
              Severidad del síntoma
            </p>
            <span className="block text-[28px] text-white tabular-nums mb-3" style={{ fontFamily: JAKARTA, fontWeight: 600 }}>{q5}</span>
            <input
              type="range" min={0} max={25} step={1}
              value={q5}
              onChange={e => setQ5(parseInt(e.target.value))}
              className="w-full accent-white"
            />
            <div className="flex justify-between text-[10px] text-white/35 mt-1" style={{ fontFamily: JAKARTA }}>
              <span>Sin dolor</span><span>Severo</span>
            </div>
          </div>
        </motion.div>
      )}

      {hasIssue !== null && (
        <div
          className="mt-6 w-full max-w-[280px] rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}
        >
          <span className="text-[11px] tracking-[0.16em] text-white/45 uppercase" style={{ fontFamily: JAKARTA }}>OSTRC Score</span>
          <span className="text-[18px] text-white tabular-nums" style={{ fontFamily: JAKARTA, fontWeight: 600 }}>
            {value ?? 0}<span className="text-white/35 text-[11px]"> / 100</span>
          </span>
        </div>
      )}
    </div>
  );
};

interface GroupProps {
  title: string;
  value: number | null;
  options: Option[];
  onChange: (v: number) => void;
}

const OstrcGroup = ({ title, value, options, onChange }: GroupProps) => (
  <div className="text-center">
    <p className="text-[11px] tracking-[0.16em] text-white/55 uppercase mb-3" style={{ fontFamily: JAKARTA }}>
      {title}
    </p>
    <div className="space-y-1.5">
      {options.map(o => {
        const active = value === o.value;
        return (
          <motion.button
            key={o.value}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(o.value)}
            className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-[12.5px] text-white/85 transition-all"
            style={{
              fontFamily: JAKARTA,
              background: active
                ? 'linear-gradient(135deg, hsla(0,0%,100%,0.18) 0%, hsla(0,0%,100%,0.05) 100%)'
                : 'hsla(0,0%,100%,0.04)',
              border: active
                ? '1.5px solid hsla(0,0%,100%,0.4)'
                : '1px solid hsla(0,0%,100%,0.1)',
              boxShadow: active ? 'inset 0 1px 0 hsla(0,0%,100%,0.22)' : 'none',
            }}
          >
            <span>{o.label}</span>
            <span className="text-[10px] text-white/35 tabular-nums shrink-0 ml-2">+{o.value}</span>
          </motion.button>
        );
      })}
    </div>
  </div>
);
