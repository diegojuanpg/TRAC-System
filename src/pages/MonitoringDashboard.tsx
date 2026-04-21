import { useState } from "react";
import { useMonitoringData } from "@/hooks/useMonitoringData";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";
import { ChevronLeft, RefreshCw, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PremiumGauge } from "@/components/ui/PremiumGauge";
import { StressThermometer } from "@/components/ui/StressThermometer";

// Helpers
const getStateConfig = (level: number, ansProfile: string) => {
  if (ansProfile === 'INSUFFICIENT_DATA') return { text: "DATOS INSUFICIENTES", color: "text-muted-foreground", bg: "bg-[#1C1C1E]", border: "border-white/10" };
  switch (level) {
    case 0: return { text: "ÓPTIMO", color: "text-[#4ade80]", bg: "bg-white/5", border: "border-white/10" };
    case 1: return { text: "FATIGA LEVE", color: "text-yellow-400", bg: "bg-white/5", border: "border-white/10" };
    case 2: return { text: "FATIGA MODERADA", color: "text-orange-400", bg: "bg-white/5", border: "border-white/10" };
    case 3: return { text: "DESCANSO", color: "text-red-400", bg: "bg-white/5", border: "border-white/10" };
    default: return { text: "ÓPTIMO", color: "text-[#4ade80]", bg: "bg-white/5", border: "border-white/10" };
  }
};

const zTo10 = (z: number) => {
  return Math.max(0, Math.min(10, 5 + (z * 2.5))).toFixed(1);
};

const getTrendLabel = (type: 'readiness' | 'fatigue' | 'fitness', val: number) => {
  if (type === 'readiness') {
    return val >= 0 ? { label: "↑ subiendo", color: "text-[#4ade80]" } : { label: "↓ alerta", color: "text-orange-400" };
  }
  if (type === 'fatigue') {
    return val <= 4 ? { label: "↓ baja", color: "text-[#4ade80]" } : val <= 7 ? { label: "— moderada", color: "text-yellow-400" } : { label: "↑ alta", color: "text-red-400" };
  }
  if (type === 'fitness') {
    return val >= 7 ? { label: "↑ alto", color: "text-[#4ade80]" } : val >= 4 ? { label: "— moderado", color: "text-yellow-400" } : { label: "↓ bajo", color: "text-orange-400" };
  }
  return { label: "", color: "text-white/50" };
};

const MonitoringDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { data: realData, loading, error, refetch } = useMonitoringData();
  const [useFake, setUseFake] = useState(false);

  if (!user) return null;

  const fakeData = {
    date: new Date().toLocaleDateString('es-ES'),
    measurementTime: "08:30",
    alertLevel: 2,
    ansProfile: "SNS_DOMINANT",
    action: "Fatiga Simpática - Reducir intensidad drásticamente (cap RPE 6). Mantener volumen moderado.",
    readinessZ: -1.8,
    fatigueZ: -1.2,
    fitnessZ: -2.0,
    stfLtfRatio: 1.65,
    stf: -2.2,
    ltf: -0.4,
    peripheralStress: 0.3,
    centralStress: 1.8,
    last7Days: [
      { date: "2026-04-09", alertLevel: 0, ansProfile: "OPTIMAL" },
      { date: "2026-04-10", alertLevel: 0, ansProfile: "OPTIMAL" },
      { date: "2026-04-11", alertLevel: 1, ansProfile: "BALANCED_FATIGUED" },
      { date: "2026-04-12", alertLevel: 0, ansProfile: "OPTIMAL" },
      { date: "2026-04-13", alertLevel: 2, ansProfile: "SNS_DOMINANT" },
      { date: "2026-04-14", alertLevel: 3, ansProfile: "BALANCED_FATIGUED" },
      { date: "2026-04-15", alertLevel: 2, ansProfile: "SNS_DOMINANT" }
    ]
  };

  const data = useFake ? fakeData : realData;

  const renderContent = () => {
    if (loading && !useFake) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-8 h-8 text-white/20 animate-pulse" />
          <div className="font-mono text-xs text-white/40 tracking-[0.2em] uppercase">
            Cargando dashboard...
          </div>
        </div>
      );
    }

    if (error && !useFake) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 text-center">
          <div className="font-mono text-sm text-red-400/80 uppercase tracking-widest">{error}</div>
          <button onClick={refetch} className="text-xs font-mono text-white/50 hover:text-white transition-colors flex items-center gap-2">
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
      if (val >= 7.0) return 'text-red-400';
      if (val >= 4.0) return 'text-yellow-400';
      return 'text-[#4ade80]';
    };

    const getFit10Color = (val: number) => {
      if (val >= 7.0) return 'text-[#4ade80]';
      if (val >= 4.0) return 'text-yellow-400';
      return 'text-red-400';
    };

    const readinessColorClass = data.readinessZ < -1.5 ? 'text-red-400' : data.readinessZ > 0 ? 'text-[#4ade80]' : 'text-yellow-400';
    const readinessGlow = data.readinessZ < -1.5 ? 'rgba(248,113,113,0.5)' : data.readinessZ > 0 ? 'rgba(74,222,128,0.5)' : 'rgba(250,204,21,0.5)';

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
          <p className="font-mono text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">TRAC · Monitoring</p>
          <div className="flex items-end justify-between">
            <h1 className="font-sans font-bold text-2xl text-white/95 leading-none truncate">
              {user.name || user.email.split('@')[0]}
            </h1>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-3">
              <span className="font-mono text-[11px] text-white/60 font-medium">
                {!isNaN(Number(data.date)) && Number(data.date) > 40000
                  ? new Date(Math.round((Number(data.date) - 25569) * 86400 * 1000) + new Date().getTimezoneOffset() * 60000).toLocaleDateString('es-ES', { timeZone: 'UTC' }) 
                  : data.date}
              </span>
              {data.measurementTime && (
                <span className="font-mono text-[10px] text-white/25 tracking-widest">{data.measurementTime}</span>
              )}
            </div>
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-white/10 via-white/[0.05] to-transparent" />
        </div>

        {/* ── ESTADO DEL ATLETA ─────────────────── */}
        <div className="text-center">
          <span className="font-sans text-[11px] font-semibold text-white/55 uppercase tracking-[0.18em]">
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
          <span className="font-sans text-[11px] font-semibold text-white/55 uppercase tracking-[0.18em]">
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

          const alertColor = data.alertLevel === 1 ? '#4ade80' : data.alertLevel === 2 ? '#4ade80' : data.alertLevel === 3 ? '#facc15' : data.alertLevel === 4 ? '#fb923c' : data.alertLevel >= 5 ? '#f87171' : '#4ade80';
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
    <DarkLayout className="flex flex-col min-h-screen bg-[#0E0E0E]">
      {/* Botones Flotantes Superiores */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2.5 rounded-full backdrop-blur-md">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setUseFake(!useFake)} 
          className={`px-3 py-1.5 rounded-md backdrop-blur-md font-mono text-[10px] tracking-widest uppercase transition-colors border ${useFake ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'}`}
        >
          {useFake ? 'Data Simulada ON' : 'Data Simulada OFF'}
        </button>
      </div>

      {renderContent()}
    </DarkLayout>
  );
};

export default MonitoringDashboard;
