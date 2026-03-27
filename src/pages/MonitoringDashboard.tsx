import { useMonitoringData } from "@/hooks/useMonitoringData";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";
import { motion } from "framer-motion";
import { ChevronLeft, RefreshCw, Activity } from "lucide-react";
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
    const sorted = [...data.readinessTrend].sort((a,b) => a.readiness - b.readiness);
    const minZ = sorted.length ? sorted[0].readiness - 0.5 : -3;
    const maxZ = sorted.length ? sorted[sorted.length - 1].readiness + 0.5 : 3;
    const range = maxZ - minZ;

    return (
      <div className="flex-1 overflow-y-auto pb-24 pt-20 px-5 space-y-8 max-w-md mx-auto w-full">
        
        {/* State Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`w-full rounded-xl border ${stateConfig.border} ${stateConfig.bg} p-4 flex items-center justify-between backdrop-blur-sm`}
        >
          <div className={`font-mono font-bold tracking-[0.15em] text-sm ${stateConfig.color}`}>
            {stateConfig.text}
          </div>
          <div className="font-mono text-xs text-white/60">
            Z {(data.readinessZ > 0 ? "+" : "")}{data.readinessZ.toFixed(1)} σ
          </div>
        </motion.div>

        {/* Primary Metrics */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">Readiness</div>
            <div className="text-2xl font-semibold tracking-tight text-white/90">
              {(data.readinessZ > 0 ? "+" : "")}{data.readinessZ.toFixed(1)}
            </div>
            <div className="font-mono text-[9px] text-white/30 truncate">σ (Baseline)</div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">Fatiga</div>
            <div className="text-2xl font-semibold tracking-tight text-white/90">
              {zTo10(data.fatigueZ)}
            </div>
            <div className="font-mono text-[9px] text-white/30">/ 10</div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">Fitness</div>
            <div className="text-2xl font-semibold tracking-tight text-white/90">
              {zTo10(data.fitnessZ)}
            </div>
            <div className="font-mono text-[9px] text-white/30">/ 10</div>
          </div>
        </motion.div>

        {/* Secondary Metrics */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-y-6 gap-x-4 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">HRV 7d</div>
            <div className="text-lg font-medium text-white/80">{data.hrv7d.toFixed(2)}</div>
            <div className="font-mono text-[9px] text-green-400">Δ {(data.hrvDelta > 0 ? "+" : "")}{data.hrvDelta.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">STF / LTF</div>
            <div className="text-lg font-medium text-white/80">{data.stfLtfRatio.toFixed(2)}</div>
            <div className="font-mono text-[9px] text-white/30">STF: {data.stf.toFixed(1)} | LTF: {data.ltf.toFixed(1)}</div>
          </div>
        </motion.div>

        {/* Last 7 Days Blocks */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-3 pt-4 border-t border-white/5">
          <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">Últimos 7 días</div>
          <div className="flex items-center gap-2">
            {data.last7Days.slice(-7).map((day, i) => {
              const bg = day.ansProfile === 'INSUFFICIENT_DATA' ? 'bg-white/10' :
                         day.alertLevel === 0 ? 'bg-green-500/20 text-green-400' :
                         day.alertLevel === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                         day.alertLevel === 2 ? 'bg-orange-500/20 text-orange-400' :
                         'bg-red-500/20 text-red-400';
              const isToday = i === data.last7Days.length - 1;
              const dateObj = new Date(day.date);
              dateObj.setHours(dateObj.getHours() + 12); // Adjust timezone offset simply
              const dayName = isToday ? 'Hoy' : dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase();

              return (
                <div key={i} className={`flex-1 flex items-center justify-center py-2 rounded-md ${bg} ${isToday ? 'border border-current opacity-100' : 'opacity-70'}`}>
                  <span className="font-mono text-[10px] uppercase font-semibold">{dayName}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recommendation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-3 pt-4 border-t border-white/5">
           <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">Recomendación</div>
           <div className={`text-sm leading-relaxed ${stateConfig.color} pl-3 border-l-2 ${stateConfig.border}`}>
             {data.action || "Ninguna acción detectada. Entrena según sensaciones."}
           </div>
        </motion.div>

        {/* Soreness Semaphores */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-4 pt-6 border-t border-white/5">
          <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase">Soreness / Injury</div>
          <div className="grid grid-cols-4 gap-2">
            {[ 
              { label: 'PUSH', val: data.soreness.push },
              { label: 'PULL', val: data.soreness.pull },
              { label: 'LEGS', val: data.soreness.legs },
              { label: 'INJURY', val: data.soreness.injury }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="font-mono text-[9px] text-white/50">{s.label}</span>
                <div className={`w-3 h-3 rounded-full ${getSorenessColor(s.val)}`} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Readiness Trend Sparkline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3 pt-6 border-t border-white/5 pb-8">
          <div className="font-mono text-[9px] tracking-[0.1em] text-white/40 uppercase flex justify-between">
            <span>Readiness Trend</span>
            <span>z=0 Baseline</span>
          </div>
          <div className="h-24 w-full relative">
            {/* Zero Line */}
            <div className="absolute top-[50%] left-0 right-0 h-px bg-white/20 border-dashed" 
                 style={{ top: `${((maxZ - 0) / range) * 100}%` }} />
            
            {/* SVG Sparkline */}
            <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="rgba(255,255,255,0.6)"
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
                return <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(255,255,255,0.9)" />;
              })}
            </svg>
          </div>
        </motion.div>

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
