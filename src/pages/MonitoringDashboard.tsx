import { useMonitoringData } from "@/hooks/useMonitoringData";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";
import { ChevronLeft, RefreshCw, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const { data, loading, error, refetch } = useMonitoringData();

  if (!user) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-8 h-8 text-white/20 animate-pulse" />
          <div className="font-mono text-xs text-white/40 tracking-[0.2em] uppercase">
            Cargando dashboard...
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
    const fat10 = parseFloat(zTo10(data.fatigueZ));
    const fit10 = parseFloat(zTo10(data.fitnessZ));

    const readTrend = getTrendLabel('readiness', data.readinessZ);
    const fatTrend = getTrendLabel('fatigue', fat10);
    const fitTrend = getTrendLabel('fitness', fit10);

    return (
      <div className="flex-1 overflow-y-auto pb-12 pt-20 px-5 max-w-md mx-auto w-full space-y-5">

        {/* Cabecera Clásica (Nombre y Fecha) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-3 border-b border-white/5 gap-2">
          <div className="font-sans font-bold text-[19px] text-white/95 truncate w-full">
            {user.name || user.email.split('@')[0]}
          </div>
          <div className="font-sans font-bold text-base text-white/95 whitespace-nowrap">
            {data.date} {data.measurementTime ? `- ${data.measurementTime}` : ''}
          </div>
        </div>

        {/* Barra de Estado */}
        <div className={`w-full py-5 border ${stateConfig.border} ${stateConfig.bg} flex items-center justify-center`}>
          <div className={`font-sans font-bold text-3xl uppercase ${stateConfig.color}`}>
            {stateConfig.text}
          </div>
        </div>

        {/* Bloque 1: Readiness, Fatiga, Fitness */}
        <div className="bg-[#1C1C1E] flex justify-between p-5 border border-white/5 shadow-md">
          <div className="flex flex-col flex-1 items-start">
            <div className="font-mono text-[9px] tracking-widest text-white/60 uppercase mb-2">Readiness</div>
            <div className="text-[26px] font-bold tracking-tight text-white mb-1.5 flex items-baseline leading-none">
              <span className="mr-1">{(data.readinessZ > 0 ? "+" : "")}{data.readinessZ.toFixed(1)}</span>
              <span className="text-white/40 text-lg font-normal font-sans">σ</span>
            </div>
            <div className={`font-sans text-[11px] font-bold ${readTrend.color}`}>{readTrend.label}</div>
          </div>
          <div className="flex flex-col flex-1 items-start justify-between">
            <div className="font-mono text-[9px] tracking-widest text-white/60 uppercase mb-2">Fatiga</div>
            <div className="text-[26px] font-bold tracking-tight text-white mb-1.5 flex items-baseline leading-none">
              <span className="mr-1">{fat10.toFixed(1)}</span>
              <span className="text-white/40 text-[15px] font-normal font-sans">/10</span>
            </div>
            <div className={`font-sans text-[11px] font-bold ${fatTrend.color}`}>{fatTrend.label}</div>
          </div>
          <div className="flex flex-col flex-1 items-start justify-between">
            <div className="font-mono text-[9px] tracking-widest text-white/60 uppercase mb-2">Fitness</div>
            <div className="text-[26px] font-bold tracking-tight text-white mb-1.5 flex items-baseline leading-none">
              <span className="mr-1">{fit10.toFixed(1)}</span>
              <span className="text-white/40 text-[15px] font-normal font-sans">/10</span>
            </div>
            <div className={`font-sans text-[11px] font-bold ${fitTrend.color}`}>{fitTrend.label}</div>
          </div>
        </div>

        {/* Bloque 2: ACWR, STF, LTF */}
        <div className="bg-[#1C1C1E] flex justify-between p-5 border border-white/5 shadow-md">
          <div className="flex flex-col flex-1 items-start">
            <div className="font-mono text-[9px] tracking-widest text-white/60 uppercase mb-2">ACWR</div>
            <div className="text-[26px] font-bold tracking-tight text-white mb-1.5 leading-none">
              {data.stfLtfRatio.toFixed(2)}
            </div>
            <div className={`font-sans text-[11px] font-bold ${data.stfLtfRatio > 1.5 ? 'text-orange-400' : 'text-[#4ade80]'}`}>
              {data.stfLtfRatio > 1.5 ? "↑ riesgo" : data.stfLtfRatio < 0.8 ? "↓ bajo" : "— estable"}
            </div>
          </div>
          <div className="flex flex-col flex-1 items-start">
            <div className="font-mono text-[9px] tracking-widest text-white/60 uppercase mb-2">STF</div>
            <div className="text-[26px] font-bold tracking-tight text-white mb-1.5 leading-none">
              {data.stf.toFixed(0)}
            </div>
            <div className="font-sans text-[11px] font-bold text-white/50">aguda</div>
          </div>
          <div className="flex flex-col flex-1 items-start">
            <div className="font-mono text-[9px] tracking-widest text-white/60 uppercase mb-2">LTF</div>
            <div className="text-[26px] font-bold tracking-tight text-white mb-1.5 leading-none">
              {data.ltf.toFixed(0)}
            </div>
            <div className="font-sans text-[11px] font-bold text-white/50">crónica</div>
          </div>
        </div>

        {/* Bloque 3: Semana y Recomendación */}
        <div className="bg-[#1C1C1E] p-5 border border-white/5 shadow-md space-y-6">
          <div className="font-mono text-[10px] tracking-widest text-white/60 uppercase">Últimos 7 días</div>

          <div className="flex items-center justify-between gap-2.5">
            {data.last7Days.slice(-7).map((day, i) => {
              const bg = day.ansProfile === 'INSUFFICIENT_DATA' ? 'bg-white/5 text-white/30' :
                day.alertLevel === 0 ? 'bg-[#12311c] text-[#4ade80]' :
                  day.alertLevel === 1 ? 'bg-[#3d2c00] text-yellow-500' :
                    day.alertLevel === 2 ? 'bg-[#512500] text-orange-500' :
                      'bg-[#3c1111] text-red-500';

              const isToday = i === data.last7Days.length - 1;
              const dateObj = new Date(day.date);
              dateObj.setHours(dateObj.getHours() + 12);
              const dayName = isToday ? 'Hoy' : dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase();

              return (
                <div key={i} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-sm ${bg} ${isToday ? 'border border-current font-bold opacity-100' : 'opacity-80'}`}>
                  <span className="font-sans text-[11px] uppercase">{dayName}</span>
                </div>
              );
            })}
          </div>

          <div className={`text-sm font-semibold leading-relaxed tracking-wide ${stateConfig.color}`}>
            {data.action || "Ninguna acción detectada. Entrena según sensaciones."}
          </div>
        </div>

      </div>
    );
  };

  return (
    <DarkLayout className="flex flex-col min-h-screen bg-[#0E0E0E]">
      {/* Botón de Regreso Flotante (Para no ensuciar la cabecera del boceto) */}
      <div className="absolute top-4 left-4 z-40">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2.5 rounded-full backdrop-blur-md">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {renderContent()}
    </DarkLayout>
  );
};

export default MonitoringDashboard;
