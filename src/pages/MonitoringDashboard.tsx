import { motion } from "framer-motion";
import { useMonitoringData } from "@/hooks/useMonitoringData";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";
import { ChevronLeft, RefreshCw, Activity, Plus, HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PremiumGauge } from "@/components/ui/PremiumGauge";
import { StressThermometer } from "@/components/ui/StressThermometer";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const glassPanel = {
  background: "linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.03) 100%)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid hsla(0,0%,100%,0.12)",
  boxShadow: "0 6px 20px hsla(0,0%,0%,0.28), inset 0 1px 0 hsla(0,0%,100%,0.2)",
} as const;

const SectionLabel = ({ title }: { title: string }) => (
  <div className="text-center">
    <span className="text-[11px] font-semibold text-white/65 uppercase tracking-[0.2em]" style={{ fontFamily: JAKARTA }}>
      {title}
    </span>
  </div>
);

const zTo10 = (z: number) => Math.max(0, Math.min(10, 5 + (z * 2.5))).toFixed(1);

const getAcwrLabel  = (val: number) => val < 0.8 ? "Subcarga" : val <= 1.2 ? "Carga Óptima" : val <= 1.5 ? "Carga Alta" : "Exceso Agudo";
const getStfLabel   = (z: number)   => { const f = 5 - (z * 1.666); return f < 2.5 ? "Falta Estímulo" : f <= 4.5 ? "Listo para PRs" : f <= 5.5 ? "Fatiga Óptima" : f <= 7.5 ? "Fatiga Moderada" : "Fatiga Crítica"; };
const getLtfLabel   = (z: number)   => { const f = 5 - (z * 1.666); return f < 2.5 ? "Desentrenamiento" : f <= 4.5 ? "Reservas Altas" : f <= 5.5 ? "Base Óptima" : f <= 7.5 ? "Fatiga crónica leve" : "Sobreentrenamiento"; };
const getAcwrStatus = (val: number) => val > 1.5 ? 'danger' : val < 0.8 ? 'detraining' : 'optimal';
const getFatigueStatus = (val: number) => val < -1.5 ? 'danger' : val > 0.5 ? 'detraining' : 'optimal';
const getZScorePct  = (z: number)   => Math.max(0, Math.min(100, ((z + 3) / 6) * 100));
const getFatiguePct = (z: number)   => Math.max(0, Math.min(100, ((3 - z) / 6) * 100));
const getAcwrPct    = (acwr: number)=> Math.max(0, Math.min(100, (acwr / 2) * 100));
const formatZ       = (z: number)   => (z > 0 ? "+" : "") + z.toFixed(1);
const formatFatigue10 = (z: number) => Math.max(0, Math.min(10, 5 - (z * 1.666))).toFixed(1);

const MonitoringDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useMonitoringData();

  if (!user) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-8 h-8 text-white/30 animate-pulse" />
          <div className="text-[11px] text-white/55 tracking-[0.22em] uppercase" style={{ fontFamily: JAKARTA, fontWeight: 600 }}>
            Cargando dashboard...
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 text-center">
          <div className="text-[13px] text-red-300/90 uppercase tracking-[0.18em]" style={{ fontFamily: JAKARTA, fontWeight: 600 }}>
            {error}
          </div>
          <button onClick={refetch} className="text-[12px] text-white/60 hover:text-white transition-colors flex items-center gap-2" style={{ fontFamily: JAKARTA }}>
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

    const readinessColorHex = data.readinessZ < -1.5 ? '#f87171' : data.readinessZ > 0 ? '#4ade80' : '#facc15';
    const acwrHex = data.stfLtfRatio > 1.5 ? '#f87171' : data.stfLtfRatio < 0.8 ? '#60a5fa' : '#4ade80';
    const alertColor = data.alertLevel === 1 ? '#6ee7a0' : data.alertLevel === 2 ? '#6ee7a0' : data.alertLevel === 3 ? '#fcd34d' : data.alertLevel === 4 ? '#fdba74' : data.alertLevel >= 5 ? '#fca5a5' : '#6ee7a0';
    const alertLabel = data.alertLevel === 1 ? 'ÓPTIMO' : data.alertLevel === 2 ? 'BUENO' : data.alertLevel === 3 ? 'PRECAUCIÓN' : data.alertLevel === 4 ? 'ALERTA' : data.alertLevel >= 5 ? 'CRÍTICO' : 'ÓPTIMO';

    const ps = data.peripheralStress ?? 0;
    const cs = data.centralStress ?? 0;
    const psDominant = ps > 1.0;
    const csDominant = cs > 1.0;
    let stressMsg = '';
    if (psDominant && csDominant) stressMsg = 'Estrés sistémico elevado. Se recomienda sesión regenerativa o descanso activo. Evitar volumen e intensidad alta.';
    else if (csDominant) stressMsg = 'Estrés central dominante. Se recomienda trabajar con RPE submáximo, evitar overshooting y priorizar calidad de sueño.';
    else if (psDominant) stressMsg = 'Estrés periférico dominante. Considerar reducir volumen en grupos musculares afectados y priorizar movilidad/recuperación.';
    else if (ps > 0.5 || cs > 0.5) stressMsg = 'Estrés moderado. Monitorizar sensaciones durante la sesión. Entrenar según plan con atención a señales de fatiga.';
    else stressMsg = 'Sin estrés significativo detectado. El sistema nervioso y muscular se encuentran dentro de parámetros normales.';

    const dateStr = !isNaN(Number(data.date)) && Number(data.date) > 40000
      ? new Date(Math.round((Number(data.date) - 25569) * 86400 * 1000) + new Date().getTimezoneOffset() * 60000).toLocaleDateString('es-ES', { timeZone: 'UTC' })
      : data.date;

    return (
      <div
        className="flex-1 overflow-y-auto px-4 max-w-md mx-auto w-full space-y-4"
        style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(3rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* ── HEADER ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-white/40 uppercase" style={{ fontFamily: JAKARTA }}>
              Readiness
            </span>
            <span className="text-[11px] font-semibold tracking-[0.18em] text-white/40 uppercase" style={{ fontFamily: JAKARTA }}>
              TRAC
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <HeartPulse className="w-4 h-4 text-white/35 shrink-0" />
              <h1 className="text-[36px] leading-none font-semibold text-white truncate"
                style={{ fontFamily: OUTFIT, letterSpacing: '-0.03em' }}>
                {user.name?.split(' ')[0] || user.email.split('@')[0]}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-[11px] text-white/55 font-medium" style={{ fontFamily: JAKARTA }}>{dateStr}</span>
              {data.measurementTime && (
                <span className="text-[10px] text-white/30 tracking-[0.14em]" style={{ fontFamily: JAKARTA }}>{data.measurementTime}</span>
              )}
            </div>
          </div>
          <div className="mt-4 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.12), transparent)" }} />
        </div>

        {/* ── ESTADO DEL ATLETA ── */}
        <SectionLabel title="Estado del Atleta" />
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            ...glassPanel,
            border: `1px solid ${readinessColorHex}28`,
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${readinessColorHex}08 0%, transparent 70%), hsla(0,0%,100%,0.015)`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px]"
            style={{ background: `linear-gradient(to right, transparent, ${readinessColorHex}90, transparent)` }} />
          <div className="grid grid-cols-3 gap-2 px-3 pb-5 pt-4">
            <PremiumGauge
              label="Readiness"
              value={formatZ(data.readinessZ)}
              status={data.readinessZ > 0.5 ? 'optimal' : data.readinessZ > -1.5 ? 'neutral' : 'danger'}
              percentage={getZScorePct(data.readinessZ)}
              type="readiness"
              subLabel={data.readinessZ > 0.5 ? 'Óptimo' : data.readinessZ > -0.5 ? 'Bueno' : data.readinessZ > -1.0 ? 'Precaución' : data.readinessZ > -1.5 ? 'Alerta' : 'Crítico'}
            />
            <PremiumGauge
              label="Fatigue"
              value={fat10}
              status={fat10Num >= 7 ? 'danger' : fat10Num >= 4 ? 'neutral' : 'optimal'}
              percentage={fat10Num * 10}
              type="fatigue_fitness"
              subLabel={fat10Num >= 8 ? 'Fatiga Alta' : fat10Num >= 6 ? 'Moderada' : fat10Num >= 4 ? 'Leve' : 'Baja'}
            />
            <PremiumGauge
              label="Fitness"
              value={fit10}
              status={fit10Num >= 7 ? 'optimal' : fit10Num >= 4 ? 'neutral' : 'danger'}
              percentage={fit10Num * 10}
              type="fatigue_fitness"
              subLabel={fit10Num >= 8 ? 'Muy Alto' : fit10Num >= 6 ? 'Alto' : fit10Num >= 4 ? 'Moderado' : 'Bajo'}
            />
          </div>
        </div>

        {/* ── CARGA DE ENTRENAMIENTO ── */}
        <SectionLabel title="Carga de Entrenamiento" />
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            ...glassPanel,
            border: `1px solid ${acwrHex}28`,
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${acwrHex}08 0%, transparent 70%), hsla(0,0%,100%,0.015)`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px]"
            style={{ background: `linear-gradient(to right, transparent, ${acwrHex}90, transparent)` }} />
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

        {/* ── RECOMENDACIÓN & ESTRÉS ── */}
        <SectionLabel title="Recomendación" />
        <div
          className="rounded-2xl relative overflow-hidden"
          style={{
            ...glassPanel,
            border: `1px solid ${alertColor}28`,
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${alertColor}07 0%, transparent 65%), hsla(0,0%,100%,0.015)`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1.5px]"
            style={{ background: `linear-gradient(to right, transparent, ${alertColor}90, transparent)` }} />

          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase" style={{ fontFamily: JAKARTA }}>
              Estado
            </p>
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ fontFamily: JAKARTA, color: alertColor, backgroundColor: `${alertColor}18`, border: `1px solid ${alertColor}35` }}
            >
              {alertLabel}
            </span>
          </div>

          <div className="px-5 pb-4">
            <p className="text-[14px] text-white/85 leading-relaxed" style={{ fontFamily: JAKARTA }}>
              {data.action || "No se requieren ajustes inmediatos."}
            </p>
          </div>

          <div className="mx-5 h-px" style={{ background: "hsla(0,0%,100%,0.06)" }} />

          <div className="flex items-start justify-around px-4 pt-5 pb-4">
            <StressThermometer label="Peripheral Stress" shortLabel="PS" value={data.peripheralStress ?? 0} />
            <div className="w-px self-stretch mx-2" style={{ background: "hsla(0,0%,100%,0.06)" }} />
            <StressThermometer label="Central Stress" shortLabel="CS" value={data.centralStress ?? 0} />
          </div>

          <div
            className="mx-5 mb-5 px-4 py-3 rounded-xl"
            style={{ background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)" }}
          >
            <p className="text-[12px] text-white/45 leading-relaxed text-center" style={{ fontFamily: JAKARTA }}>
              {stressMsg}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DarkLayout className="flex flex-col min-h-[100dvh]">
      {/* Botones Flotantes Superiores */}
      <div className="absolute left-4 right-4 z-40 flex items-center justify-between" style={{ top: 'max(1.25rem, env(safe-area-inset-top, 1.25rem))' }}>
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

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => navigate('/morning')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-[12px] font-semibold"
            style={{
              fontFamily: JAKARTA,
              background: "linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)",
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              border: "1.5px solid hsla(0,0%,100%,0.35)",
              boxShadow: "0 4px 14px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.3)",
              letterSpacing: "0.02em",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo registro
          </motion.button>

        </div>
      </div>

      {renderContent()}
    </DarkLayout>
  );
};

export default MonitoringDashboard;
