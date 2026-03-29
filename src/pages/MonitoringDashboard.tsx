import { useState } from "react";
import { useMonitoringData } from "@/hooks/useMonitoringData";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, RefreshCw, Activity, User, LineChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mapping Alert Level to colors and text
const getStateConfig = (level: number, ansProfile: string) => {
  if (ansProfile === 'INSUFFICIENT_DATA') return { text: "DATOS INSUFICIENTES", color: "text-muted-foreground", bg: "bg-white/5", border: "border-white/10" };
  switch (level) {
    case 0: return { text: "ÓPTIMO", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
    case 1: return { text: "FATIGA LEVE", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    case 2: return { text: "FATIGA MODERADA", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    case 3: return { text: "DESCANSO", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    default: return { text: "ÓPTIMO", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
  }
};

const getSorenessColor = (val: number) => {
  if (val <= 2.5) return "bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.4)]";
  if (val <= 5.0) return "bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.4)]";
  return "bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
};

// Convert Z-score to 0-10 scale for Fatigue and Fitness 
const zTo10 = (z: number) => {
  return Math.max(0, Math.min(10, 5 + (z * 2.5))).toFixed(1);
};

const MonitoringDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useMonitoringData();
  const [viewMode, setViewMode] = useState<'athlete' | 'coach'>('athlete');

  if (!user) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-8 h-8 text-white/20 animate-pulse" />
          <div className="font-mono text-xs text-white/40 tracking-[0.2em] uppercase">
            Analizando métricas...
          </div>
        </div>
      );
    }

    if (error) {
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

    const stateConfig = getStateConfig(data.alertLevel, data.ansProfile);

    // Get max/min for the sparkline trend
    const sorted = [...data.readinessTrend].sort((a, b) => a.readiness - b.readiness);
    const minZ = sorted.length ? sorted[0].readiness - 0.5 : -3;
    const maxZ = sorted.length ? sorted[sorted.length - 1].readiness + 0.5 : 3;
    const range = maxZ - minZ;

    const renderAthleteView = () => (
      <div className="space-y-8">
        {/* Big State */}
        <div className={`w-full rounded-2xl border ${stateConfig.border} ${stateConfig.bg} p-8 flex flex-col items-center justify-center backdrop-blur-sm shadow-lg`}>
          <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest mb-3">Estado de Hoy</span>
          <div className={`font-mono font-black tracking-widest text-3xl ${stateConfig.color}`}>
            {stateConfig.text}
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] tracking-[0.1em] text-white/40 uppercase">Plan de Acción</div>
          <div className={`text-lg font-medium leading-relaxed ${stateConfig.color} pl-4 border-l-4 ${stateConfig.border} bg-white/5 p-4 rounded-r-xl shadow-sm`}>
            {data.action || "Ninguna acción detectada. Entrena según sensaciones."}
          </div>
        </div>

        {/* Last 7 Days Blocks */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="font-mono text-[10px] tracking-[0.1em] text-white/40 uppercase">Tu Semana</div>
          <div className="flex items-center gap-2">
            {data.last7Days.slice(-7).map((day, i) => {
              const bg = day.ansProfile === 'INSUFFICIENT_DATA' ? 'bg-white/10' :
                day.alertLevel === 0 ? 'bg-green-500/20 text-green-400' :
                  day.alertLevel === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    day.alertLevel === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400';
              const isToday = i === data.last7Days.length - 1;
              const dateObj = new Date(day.date);
              dateObj.setHours(dateObj.getHours() + 12);
              const dayName = isToday ? 'Hoy' : dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase();

              return (
                <div key={i} className={`flex-1 flex items-center justify-center py-3 rounded-lg ${bg} ${isToday ? 'border-2 border-current shadow-md opacity-100 scale-[1.03] transition-transform' : 'opacity-60'}`}>
                  <span className="font-mono text-[11px] uppercase font-bold">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Soreness Semaphores */}
        <div className="space-y-4 pt-4 border-t border-white/5 pb-6">
          <div className="font-mono text-[10px] tracking-[0.1em] text-white/40 uppercase">Zonas de Atención</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'PUSH', val: data.soreness.push },
              { label: 'PULL', val: data.soreness.pull },
              { label: 'LEGS', val: data.soreness.legs },
              { label: 'INJURY', val: data.soreness.injury }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 shadow-sm">
                <span className="font-mono text-[10px] text-white/70 font-semibold">{s.label}</span>
                <div className={`w-4 h-4 rounded-full ${getSorenessColor(s.val)}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const renderCoachView = () => (
      <div className="space-y-6 pb-8">
        {/* Simple State Badge for Coach */}
        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
          <span className="font-mono text-xs text-white/50 uppercase">Alerta Actual</span>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest ${stateConfig.bg} ${stateConfig.color} ${stateConfig.border} border`}>
            {stateConfig.text}
          </div>
        </div>

        {/* Primary Metrics: Readiness, Fatiga, Fitness */}
        <div className="flex justify-between items-center bg-white/5 rounded-xl border border-white/5 overflow-hidden shadow-sm">
          <div className="flex-[1.5] p-5 border-r border-white/5 bg-white/5 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="font-mono text-[10px] tracking-[0.1em] text-white/50 uppercase mb-1">Readiness (Z)</div>
            <div className={`text-4xl font-bold tracking-tight ${(data.readinessZ < -1.5) ? 'text-red-400' : 'text-white/95'}`}>
              {(data.readinessZ > 0 ? "+" : "")}{data.readinessZ.toFixed(2)}
            </div>
          </div>
          <div className="flex-1 p-3 flex flex-col items-center justify-center border-r border-white/5">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase mb-1">Fatiga</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold tracking-tight text-white/80">{zTo10(data.fatigueZ)}</span>
              <span className="text-[9px] font-mono text-white/30">/10</span>
            </div>
          </div>
          <div className="flex-1 p-3 flex flex-col items-center justify-center">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase mb-1">Fitness</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold tracking-tight text-white/80">{zTo10(data.fitnessZ)}</span>
              <span className="text-[9px] font-mono text-white/30">/10</span>
            </div>
          </div>
        </div>

        {/* Carga & Riesgo: ACWR, STF, LTF, HRV */}
        <div className="flex justify-between items-center bg-white/5 rounded-xl border border-white/5 overflow-hidden shadow-sm">
          <div className="flex-[1.8] p-4 border-r border-white/5 bg-white/5 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="font-mono text-[10px] tracking-[0.1em] text-white/50 uppercase mb-1">ACWR (Risk)</div>
            <div className={`text-3xl font-bold tracking-tight ${(data.stfLtfRatio > 1.5 || data.stfLtfRatio < 0.8) ? 'text-orange-400' : 'text-green-400'}`}>
              {data.stfLtfRatio.toFixed(2)}
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col items-center justify-center border-r border-white/5">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase mb-1">STF (Aguda)</div>
            <div className="text-base font-medium tracking-tight text-white/80">
              {data.stf.toFixed(0)}
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col items-center justify-center border-r border-white/5">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase mb-1">LTF (Crónica)</div>
            <div className="text-base font-medium tracking-tight text-white/80">
              {data.ltf.toFixed(0)}
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col items-center justify-center relative">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase mb-1">HRV (7d)</div>
            <div className="text-base font-medium tracking-tight text-white/80">
              {data.hrv7d.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Readiness Trend Sparkline */}
        <div className="space-y-3 pt-6 border-t border-white/5 pb-2">
          <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase flex justify-between">
            <span>Tendencia Readiness (Z-Score)</span>
            <span>Estabilidad (z=0)</span>
          </div>
          <div className="h-32 w-full relative bg-white/[0.02] rounded-xl border border-white/5 p-2">
            {/* Zero Line */}
            <div className="absolute left-0 right-0 h-px bg-white/20 border-dashed"
              style={{ top: `${((maxZ - 0) / range) * 100}%` }} />

            <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={data.readinessTrend.map((pt, i) => {
                  const x = (i / Math.max(1, data.readinessTrend.length - 1)) * 100;
                  const y = ((maxZ - pt.readiness) / range) * 100;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {data.readinessTrend.map((pt, i) => {
                const x = (i / Math.max(1, data.readinessTrend.length - 1)) * 100;
                const y = ((maxZ - pt.readiness) / range) * 100;
                const dotColor = pt.readiness < -1.5 ? "rgba(248,113,113,1)" : "rgba(255,255,255,0.9)";
                return <circle key={i} cx={x} cy={y} r="2" fill={dotColor} />;
              })}
            </svg>
          </div>
        </div>
      </div>
    );

    return (
      <div className="flex-1 overflow-y-auto pb-6 pt-20 px-5 max-w-md mx-auto w-full">
        {/* Date */}
        <div className="font-mono text-[10px] text-white/50 uppercase tracking-widest text-center mb-5">
          {data.date} {data.measurementTime ? `· ${data.measurementTime}` : ''}
        </div>

        {/* Toggle Atleta / Entrenador */}
        <div className="bg-[#111111] p-1 rounded-xl flex items-center mb-8 border border-white/10 shadow-inner">
          <button
            onClick={() => setViewMode('athlete')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase transition-all duration-300 ${viewMode === 'athlete'
                ? 'bg-[#222222] text-white shadow-md font-bold'
                : 'text-white/40 hover:text-white/70'
              }`}
          >
            <User className="w-4 h-4" /> Atleta
          </button>
          <button
            onClick={() => setViewMode('coach')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase transition-all duration-300 ${viewMode === 'coach'
                ? 'bg-[#222222] text-white shadow-md font-bold'
                : 'text-white/40 hover:text-white/70'
              }`}
          >
            <LineChart className="w-4 h-4" /> Entrenador
          </button>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'athlete' ? (
            <motion.div
              key="athlete"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {renderAthleteView()}
            </motion.div>
          ) : (
            <motion.div
              key="coach"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderCoachView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const formattedDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short'
  }).replace(',', ' ·');

  return (
    <DarkLayout className="flex flex-col">
      {/* Top Nav */}
      <div className="fixed top-0 left-0 right-0 px-5 pt-5 pb-3 bg-[#050505]/90 backdrop-blur-md z-40 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="font-mono text-sm font-semibold tracking-tight text-white/90">
              {user.name || user.email.split('@')[0]}
            </div>
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase text-white/40 text-right">
          {formattedDate}
        </div>
      </div>

      {renderContent()}
    </DarkLayout>
  );
};

export default MonitoringDashboard;
