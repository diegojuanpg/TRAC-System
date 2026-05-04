import { useState } from "react";
import { useMonitoringData } from "@/hooks/useMonitoringData";
import { type MonitoringData } from "@/hooks/useMonitoringData";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";
import { ChevronLeft, RefreshCw, Activity, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PremiumGauge } from "@/components/ui/PremiumGauge";
import { StressThermometer } from "@/components/ui/StressThermometer";

const MOCK_DATA: MonitoringData = {
  athleteName: "Demo Atleta",
  date: "2026-04-24",
  measurementTime: "07:32",
  alertLevel: 2,
  ansProfile: "BALANCED_FATIGUED",
  action: "Fatiga moderada detectada. Se recomienda sesión de baja intensidad o trabajo técnico. Evitar esfuerzo máximo hoy.",
  readinessZ: -0.8,
  fatigueZ: 0.6,
  fitnessZ: 0.4,
  stfLtfRatio: 1.18,
  stf: 0.5,
  ltf: -0.3,
  soreness: { push: 2, pull: 1, legs: 3, injury: 0 },
  peripheralStress: 0.8,
  centralStress: 0.4,
  readinessTrend: [],
  last7Days: [],
};

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

// Helpers
const getStateConfig = (level: number, ansProfile: string) => {
  if (ansProfile === 'INSUFFICIENT_DATA') return { text: "DATOS INSUFICIENTES", color: "text-white/45", bg: "bg-white/[0.03]", border: "border-white/10" };
  switch (level) {
    case 0: return { text: "ÓPTIMO", color: "text-[#6ee7a0]", bg: "bg-white/[0.03]", border: "border-white/10" };
    case 1: return { text: "FATIGA LEVE", color: "text-[#fcd34d]", bg: "bg-white/[0.03]", border: "border-white/10" };
    case 2: return { text: "FATIGA MODERADA", color: "text-[#fdba74]", bg: "bg-white/[0.03]", border: "border-white/10" };
    case 3: return { text: "DESCANSO", color: "text-[#fca5a5]", bg: "bg-white/[0.03]", border: "border-white/10" };
    default: return { text: "ÓPTIMO", color: "text-[#6ee7a0]", bg: "bg-white/[0.03]", border: "border-white/10" };
  }
};

const zTo10 = (z: number) => {
  return Math.max(0, Math.min(10, 5 + (z * 2.5))).toFixed(1);
};

const getTrendLabel = (type: 'readiness' | 'fatigue' | 'fitness', val: number) => {
  if (type === 'readiness') {
    return val >= 0 ? { label: "↑ subiendo", color: "text-[#6ee7a0]" } : { label: "↓ alerta", color: "text-[#fdba74]" };
  }
  if (type === 'fatigue') {
    return val <= 4 ? { label: "↓ baja", color: "text-[#6ee7a0]" } : val <= 7 ? { label: "— moderada", color: "text-[#fcd34d]" } : { label: "↑ alta", color: "text-[#fca5a5]" };
  }
  if (type === 'fitness') {
    return val >= 7 ? { label: "↑ alto", color: "text-[#6ee7a0]" } : val >= 4 ? { label: "— moderado", color: "text-[#fcd34d]" } : { label: "↓ bajo", color: "text-[#fdba74]" };
  }
  return { label: "", color: "text-white/50" };
};

const MonitoringDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { data: realData, loading, error, refetch } = useMonitoringData();
  const [useMock, setUseMock] = useState(false);

  const data = useMock ? MOCK_DATA : realData;

  if (!user) return null;

  const renderContent = () => {
    if (!useMock && loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-8 h-8 text-white/30 animate-pulse" />
          <div
            className="text-[11px] text-white/55 tracking-[0.22em] uppercase"
            style={{ fontFamily: JAKARTA, fontWeight: 600 }}
          >
            Cargando dashboard...
          </div>
        </div>
      );
    }

    if (!useMock && error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 text-center">
          <div
            className="text-[13px] text-red-300/90 uppercase tracking-[0.18em]"
            style={{ fontFamily: JAKARTA, fontWeight: 600 }}
          >
            {error}
          </div>
          <button
            onClick={refetch}
            className="text-[12px] text-white/60 hover:text-white transition-colors flex items-center gap-2"
            style={{ fontFamily: JAKARTA }}
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      );
    }

    if (!data) return null;

    const fat10Num = parseFloat(zTo10(data.fatigueZ));
    const fit10Num = parseFloat(zTo10(data.fitnessZ));
    const fat10 = fat10Num.toFixed(1);
    const fit10 = fit10Num.toFixed(1);

    const getFat10Color = (val: number) => {
      if (val >= 7.0) return 'text-[#fca5a5]';
      if (val >= 4.0) return 'text-[#fcd34d]';
      return 'text-[#6ee7a0]';
    };

    const getFit10Color = (val: number) => {
      if (val >= 7.0) return 'text-[#6ee7a0]';
      if (val >= 4.0) return 'text-[#fcd34d]';
      return 'text-[#fca5a5]';
    };

    const readinessColorClass = data.readinessZ < -1.5 ? 'text-[#fca5a5]' : data.readinessZ > 0 ? 'text-[#6ee7a0]' : 'text-[#fcd34d]';
    const readinessGlow = data.readinessZ < -1.5 ? 'rgba(252,165,165,0.4)' : data.readinessZ > 0 ? 'rgba(110,231,160,0.4)' : 'rgba(252,211,77,0.4)';

    // Helpers for coloring and gauges
    const getAcwrStatus = (val: number) => {
      if (val > 1.5) return 'danger';
      if (val < 0.8) return 'detraining';
      return 'optimal';
    };
    
    // Z-scores: > 0.5 is unusually fresh, < -1.5 is danger fatigued. 
    const getFatigueStatus = (val: number) => {
      if (val < -1.5) return 'danger';
      if (val > 0.5) return 'detraining';
      return 'optimal';
    };

    const getZScorePct = (z: number) => Math.max(0, Math.min(100, ((z + 3) / 6) * 100));
    const getFatiguePct = (z: number) => Math.max(0, Math.min(100, ((3 - z) / 6) * 100));
    const getAcwrPct = (acwr: number) => Math.max(0, Math.min(100, (acwr / 2) * 100));

    const getAcwrLabel = (val: number) => {
      if (val < 0.8) return "Subcarga";
      if (val <= 1.2) return "Carga Óptima";
      if (val <= 1.5) return "Carga Alta";
      return "Exceso Agudo";
    };

    const getStfLabel = (z: number) => {
      const f = 5 - (z * 1.666);
      if (f < 2.5) return "Falta Estímulo";
      if (f <= 4.5) return "Listo para PRs";
      if (f <= 5.5) return "Fatiga Óptima";
      if (f <= 7.5) return "Fatiga Moderada";
      return "Fatiga Crítica";
    };

    const getLtfLabel = (z: number) => {
      const f = 5 - (z * 1.666);
      if (f < 2.5) return "Desentrenamiento";
      if (f <= 4.5) return "Reservas Altas";
      if (f <= 5.5) return "Base Óptima";
      if (f <= 7.5) return "Fatiga crónica leve";
      return "Sobreentrenamiento";
    };

    const ansDescriptions: Record<string, string> = {
      'OPTIMAL': 'Sistema equilibrado. Respuesta cardiovascular estable a los cambios de postura. Recuperación asimilada.',
      'BALANCED_FATIGUED': 'Agotamiento metabólico general por entrenamiento. Perfil autonómico compensado, requiere control de volumen.',
      'SNS_DOMINANT': 'Sobre-estimulación del Sistema Simpático (lucha o huida). Respuesta cardíaca exagerada al estrés postural.',
      'PSNS_DOMINANT': 'Inhibición del Sistema Parasimpático por volumen de entrenamiento profundo. Dificultad biológica para acelerar el ritmo cardíaco.',
      'INSUFFICIENT_DATA': 'Recopilando datos de línea base para establecer tendencia estadística individual (requiere 7 días).'
    };

    const formatZ = (z: number) => (z > 0 ? "+" : "") + z.toFixed(1);
    const formatFatigue10 = (z: number) => Math.max(0, Math.min(10, 5 - (z * 1.666))).toFixed(1);

    return (
      <div className="flex-1 overflow-y-auto pb-12 pt-20 px-5 max-w-md mx-auto w-full space-y-4">
        
        {/* ── HEADER ─────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
              style={{ fontFamily: JAKARTA }}
            >
              Monitoring
            </span>
            <span
              className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
              style={{ fontFamily: JAKARTA }}
            >
              TRAC
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="relative inline-block min-w-0">
              <div
                className="absolute inset-0 blur-2xl pointer-events-none"
                style={{ background: 'hsla(0,0%,100%,0.18)', transform: 'scale(1.15)' }}
                aria-hidden="true"
              />
              <h1
                className="relative text-[32px] text-white leading-[1.0] truncate"
                style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.03em' }}
              >
                {user.name || user.email.split('@')[0]}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span
                className="text-[11px] text-white/75 font-medium"
                style={{ fontFamily: JAKARTA }}
              >
                {!isNaN(Number(data.date)) && Number(data.date) > 40000
                  ? new Date(Math.round((Number(data.date) - 25569) * 86400 * 1000) + new Date().getTimezoneOffset() * 60000).toLocaleDateString('es-ES', { timeZone: 'UTC' })
                  : data.date}
              </span>
              {data.measurementTime && (
                <span
                  className="text-[10px] text-white/40 tracking-[0.14em]"
                  style={{ fontFamily: JAKARTA }}
                >
                  {data.measurementTime}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* ── ESTADO DEL ATLETA ─────────────────── */}
        <div className="text-center">
          <span
            className="text-[11px] font-semibold text-white/65 uppercase tracking-[0.2em]"
            style={{ fontFamily: JAKARTA }}
          >
            Estado del Atleta
          </span>
        </div>
        {(() => {
          const rHex = data.readinessZ > 0 ? '#4ade80' : data.readinessZ > -1.0 ? '#facc15' : data.readinessZ > -1.5 ? '#fb923c' : '#f87171';
          return (
            <div
              className="rounded-2xl relative overflow-hidden"
              style={{
                border: `1px solid ${rHex}28`,
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${rHex}08 0%, transparent 70%), rgba(255,255,255,0.015)`
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1.5px]"
                style={{ background: `linear-gradient(to right, transparent, ${rHex}90, transparent)` }}
              />
              <div className="grid grid-cols-3 gap-2 px-3 pb-5 pt-4">
                <PremiumGauge
                  label="Readiness"
                  value={formatZ(data.readinessZ)}
                  status={data.readinessZ > 0.5 ? 'optimal' : data.readinessZ > -0.5 ? 'optimal' : data.readinessZ > -1.5 ? 'neutral' : 'danger'}
                  percentage={getZScorePct(data.readinessZ)}
                  type="readiness"
                  subLabel={
                    data.readinessZ > 0.5 ? 'Óptimo' :
                    data.readinessZ > -0.5 ? 'Bueno' :
                    data.readinessZ > -1.0 ? 'Precaución' :
                    data.readinessZ > -1.5 ? 'Alerta' : 'Crítico'
                  }
                />
                <PremiumGauge
                  label="Fatigue"
                  value={fat10}
                  status={fat10Num >= 7 ? 'danger' : fat10Num >= 4 ? 'neutral' : 'optimal'}
                  percentage={fat10Num * 10}
                  type="fatigue_fitness"
                  subLabel={
                    fat10Num >= 8 ? 'Fatiga Alta' :
                    fat10Num >= 6 ? 'Moderada' :
                    fat10Num >= 4 ? 'Leve' : 'Baja'
                  }
                />
                <PremiumGauge
                  label="Fitness"
                  value={fit10}
                  status={fit10Num >= 7 ? 'optimal' : fit10Num >= 4 ? 'neutral' : 'danger'}
                  percentage={fit10Num * 10}
                  type="fatigue_fitness"
                  subLabel={
                    fit10Num >= 8 ? 'Muy Alto' :
                    fit10Num >= 6 ? 'Alto' :
                    fit10Num >= 4 ? 'Moderado' : 'Bajo'
                  }
                />
              </div>
            </div>
          );
        })()}

        {/* ── CARGA DE ENTRENAMIENTO ───────────── */}
        <div className="text-center">
          <span
            className="text-[11px] font-semibold text-white/65 uppercase tracking-[0.2em]"
            style={{ fontFamily: JAKARTA }}
          >
            Carga de Entrenamiento
          </span>
        </div>
        {(() => {
          const acwrHex = data.stfLtfRatio > 1.5 ? '#f87171' : data.stfLtfRatio < 0.8 ? '#60a5fa' : '#4ade80';
          return (
            <div
              className="rounded-2xl relative overflow-hidden"
              style={{
                border: `1px solid ${acwrHex}28`,
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${acwrHex}08 0%, transparent 70%), rgba(255,255,255,0.015)`
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1.5px]"
                style={{ background: `linear-gradient(to right, transparent, ${acwrHex}90, transparent)` }}
              />
              <div className="grid grid-cols-3 gap-2 px-3 pb-5 pt-4">
                <PremiumGauge
                  label="ACWR"
                  value={data.stfLtfRatio.toFixed(2)}
                  status={getAcwrStatus(data.stfLtfRatio)}
                  percentage={getAcwrPct(data.stfLtfRatio)}
                  type="acwr"
                  subLabel={getAcwrLabel(data.stfLtfRatio)}
                />
                <PremiumGauge
                  label="LTF"
                  value={formatFatigue10(data.ltf)}
                  status={getFatigueStatus(data.ltf)}
                  percentage={getFatiguePct(data.ltf)}
                  type="acwr"
                  subLabel={getLtfLabel(data.ltf)}
                />
                <PremiumGauge
                  label="STF"
                  value={formatFatigue10(data.stf)}
                  status={getFatigueStatus(data.stf)}
                  percentage={getFatiguePct(data.stf)}
                  type="acwr"
                  subLabel={getStfLabel(data.stf)}
                />
              </div>
            </div>
          );
        })()}

        {/* ═══ RECOMMENDATION & STRESS CARD ═══ */}
        {(() => {
          const ps = data.peripheralStress ?? 0;
          const cs = data.centralStress ?? 0;
          const psDominant = ps > 1.0;
          const csDominant = cs > 1.0;

          let stressMsg = '';
          if (psDominant && csDominant) {
            stressMsg = 'Estrés sistémico elevado. Se recomienda sesión regenerativa o descanso activo. Evitar volumen e intensidad alta.';
          } else if (csDominant) {
            stressMsg = 'Estrés central dominante. Se recomienda trabajar con RPE submáximo, evitar overshooting y priorizar calidad de sueño.';
          } else if (psDominant) {
            stressMsg = 'Estrés periférico dominante. Considerar reducir volumen en grupos musculares afectados y priorizar movilidad/recuperación.';
          } else if (ps > 0.5 || cs > 0.5) {
            stressMsg = 'Estrés moderado. Monitorizar sensaciones durante la sesión. Entrenar según plan con atención a señales de fatiga.';
          } else {
            stressMsg = 'Sin estrés significativo detectado. El sistema nervioso y muscular se encuentran dentro de parámetros normales.';
          }

          const alertColor = data.alertLevel === 1 ? '#6ee7a0' : data.alertLevel === 2 ? '#6ee7a0' : data.alertLevel === 3 ? '#fcd34d' : data.alertLevel === 4 ? '#fdba74' : data.alertLevel >= 5 ? '#fca5a5' : '#6ee7a0';
          const alertLabel = data.alertLevel === 1 ? 'ÓPTIMO' : data.alertLevel === 2 ? 'BUENO' : data.alertLevel === 3 ? 'PRECAUCIÓN' : data.alertLevel === 4 ? 'ALERTA' : data.alertLevel >= 5 ? 'CRÍTICO' : 'ÓPTIMO';

          return (
            <div
              className="rounded-2xl relative overflow-hidden"
              style={{
                border: `1px solid ${alertColor}28`,
                background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${alertColor}07 0%, transparent 65%), rgba(255,255,255,0.015)`
              }}
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[1.5px]"
                style={{ background: `linear-gradient(to right, transparent, ${alertColor}90, transparent)` }}
              />

              {/* Header row */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase font-semibold">
                  Recomendación
                </p>
                <span
                  className="font-mono text-[10px] tracking-widest uppercase font-bold px-3 py-1 rounded-full"
                  style={{
                    color: alertColor,
                    backgroundColor: `${alertColor}18`,
                    border: `1px solid ${alertColor}35`,
                  }}
                >
                  {alertLabel}
                </span>
              </div>

              {/* Action text */}
              <div className="px-5 pb-4">
                <p className="font-sans text-[14px] text-white/85 leading-relaxed">
                  {data.action || "No se requieren ajustes inmediatos."}
                </p>
              </div>

              {/* Divider */}
              <div className="mx-5 h-px bg-white/[0.06]" />

              {/* Stress Thermometers */}
              <div className="flex items-start justify-around px-4 pt-5 pb-4">
                <StressThermometer
                  label="Peripheral Stress"
                  shortLabel="PS"
                  value={data.peripheralStress ?? 0}
                />
                <div className="w-px bg-white/[0.06] self-stretch mx-2" />
                <StressThermometer
                  label="Central Stress"
                  shortLabel="CS"
                  value={data.centralStress ?? 0}
                />
              </div>

              {/* Stress diagnostic */}
              <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="font-sans text-[12px] text-white/45 leading-relaxed text-center">
                  {stressMsg}
                </p>
              </div>
            </div>
          );
        })()}

      </div>
    );
  };

  return (
    <DarkLayout className="flex flex-col min-h-[100dvh]">
      {/* Botones Flotantes Superiores */}
      <div className="absolute top-5 left-5 right-5 z-40 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          aria-label="Volver"
          className="text-white/70 hover:text-white active:scale-95 transition-all duration-150 flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            background: 'linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid hsla(0,0%,100%,0.18)',
            boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25)',
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setUseMock(v => !v)}
          aria-label="Datos de prueba"
          className="active:scale-95 transition-all duration-150 flex items-center gap-2 h-9 px-3.5 rounded-full"
          style={{
            background: useMock
              ? 'linear-gradient(135deg, hsla(45,80%,65%,0.22) 0%, hsla(45,80%,65%,0.1) 100%)'
              : 'linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: useMock ? '1px solid hsla(45,80%,65%,0.4)' : '1px solid hsla(0,0%,100%,0.18)',
            boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25)',
            color: useMock ? 'hsla(45,80%,72%,1)' : 'hsla(0,0%,100%,0.6)',
            fontFamily: JAKARTA,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          {useMock ? 'DEMO' : 'DEMO'}
        </button>
      </div>

      {renderContent()}
    </DarkLayout>
  );
};

export default MonitoringDashboard;
