import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const SHARED_TOKEN = import.meta.env.VITE_SHARED_TOKEN as string;

export interface MonitoringData {
  athleteName: string;
  date: number | string;
  alertLevel: number;
  ansProfile: string;
  action: string;
  readinessZ: number;
  fatigueZ: number;
  fitnessZ: number;
  hrv7d: number;
  hrvDelta: number;
  stfLtfRatio: number;
  stf: number;
  ltf: number;
  soreness: {
    push: number;
    pull: number;
    legs: number;
    injury: number;
  };
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
      
      if (!SCRIPT_URL) {
        setError("VITE_APPS_SCRIPT_URL not configured");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const urlArgs = new URLSearchParams({
          action: 'fetchDashboard',
          token: SHARED_TOKEN,
          email: user.email,
        });
        
        const finalUrl = `${SCRIPT_URL}?${urlArgs.toString()}`;
        
        console.log("======= DEBUG FETCH DASHBOARD =======");
        console.log("VITE_APPS_SCRIPT_URL que Vercel compiló:", SCRIPT_URL);
        console.log("URL final generada:", finalUrl);
        console.log("=====================================");
        
        const res = await fetch(finalUrl);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        if (json.success && json.data) {
          if (mounted) setData(json.data);
        } else {
          throw new Error(json.error || "Failed to fetch data");
        }
      } catch (err: any) {
        console.error("Fetch monitoring data error:", err);
        if (mounted) setError(err.message || "An error occurred");
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
