import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";

export interface MonitoringData {
  athleteName: string;
  date: number | string;
  measurementTime?: string;
  alertLevel: number;
  ansProfile: string;
  action: string;
  readinessZ: number;
  fatigueZ: number;
  fitnessZ: number;
  stfLtfRatio: number;
  stf: number;
  ltf: number;
  soreness: {
    push: number;
    pull: number;
    legs: number;
    injury: number;
  };
  peripheralStress: number;
  centralStress: number;
  readinessTrend: { date: string; readiness: number }[];
  last7Days: { date: string; alertLevel: number; ansProfile: string }[];
}

interface AthleteOverride {
  athleteId: string;
  name?: string;
}

export const useMonitoringData = (override?: AthleteOverride) => {
  const { user } = useUser();
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const athleteId = override?.athleteId ?? user?.athleteId ?? null;
  const athleteName = override?.name ?? user?.athleteName ?? user?.name ?? '';

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!athleteId) {
        setLoading(false);
        setError("Atleta no configurado.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: rows, error: err } = await supabase
          .from('trac_entries')
          .select('date, measurement_time, alert_level, ans_profile, trac_action, z_readiness, fatigue, fitness, stf_ltf_ratio, stf, ltf, push_soreness, pull_soreness, legs_soreness, injury, peripheral_stress, central_stress')
          .eq('athlete_id', athleteId)
          .order('date', { ascending: false })
          .limit(14);

        if (err) throw err;
        if (!rows || rows.length === 0) {
          if (mounted) setError("No hay datos.");
          return;
        }

        const sorted = [...rows].reverse();
        const last = sorted[sorted.length - 1];

        const readinessTrend = sorted.map(r => ({
          date: String(r.date),
          readiness: Number(r.z_readiness ?? 0),
        }));
        const last7 = sorted.slice(-7).map(r => ({
          date: String(r.date),
          alertLevel: Number(r.alert_level ?? 0),
          ansProfile: String(r.ans_profile ?? 'INSUFFICIENT_DATA'),
        }));

        if (mounted) setData({
          athleteName,
          date: last.date,
          measurementTime: last.measurement_time ?? '',
          alertLevel: Number(last.alert_level ?? 0),
          ansProfile: String(last.ans_profile ?? 'INSUFFICIENT_DATA'),
          action: String(last.trac_action ?? ''),
          readinessZ: Number(last.z_readiness ?? 0),
          fatigueZ: Number(last.fatigue ?? 0),
          fitnessZ: Number(last.fitness ?? 0),
          stfLtfRatio: Number(last.stf_ltf_ratio ?? 0),
          stf: Number(last.stf ?? 0),
          ltf: Number(last.ltf ?? 0),
          soreness: {
            push: Number(last.push_soreness ?? 0),
            pull: Number(last.pull_soreness ?? 0),
            legs: Number(last.legs_soreness ?? 0),
            injury: Number(last.injury ?? 0),
          },
          peripheralStress: Number(last.peripheral_stress ?? 0),
          centralStress: Number(last.central_stress ?? 0),
          readinessTrend,
          last7Days: last7,
        });
      } catch (e) {
        if (mounted) setError("No se pudo cargar la información. Intenta de nuevo.");
        void e;
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [athleteId, athleteName]);

  return { data, loading, error, refetch: () => setLoading(true) };
};
