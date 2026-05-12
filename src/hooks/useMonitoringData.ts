import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

const SHARED_TOKEN = import.meta.env.VITE_SHARED_TOKEN as string;

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

export const useMonitoringData = () => {
  const { user } = useUser();
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const scriptUrl = user.scriptUrl;
      const sheetId = user.sheetId;

      if (!scriptUrl || !sheetId) {
        setError("Configuración de atleta no encontrada. Re-inicia sesión.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const urlArgs = new URLSearchParams({
          action: 'fetchDashboard',
          token: SHARED_TOKEN,
          sheetId,
        });
        const res = await fetch(`${scriptUrl}?${urlArgs.toString()}`);

        if (!res.ok) throw new Error("No se pudo cargar la información.");

        const json = await res.json();
        if (json && json.success && json.data) {
          if (mounted) setData(json.data);
        } else {
          throw new Error("No se pudo cargar la información.");
        }
      } catch {
        if (mounted) setError("No se pudo cargar la información. Intenta de nuevo.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { data, loading, error, refetch: () => setLoading(true) };
};
