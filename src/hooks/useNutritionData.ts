import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import {
  fetchNutritionHistory,
  fetchGoals,
  fetchRefeeds,
} from '@/lib/nutritionApi';
import { Goals, EMPTY_GOALS, NutritionRow } from '@/lib/nutritionMath';

export interface NutritionDataState {
  rows: NutritionRow[];
  goals: Goals;
  refeeds: Set<string>;
  loading: boolean;
  error: string | null;
}

interface UserOverride {
  athleteId: string;
}

export function useNutritionData(userOverride?: UserOverride) {
  const { user } = useUser();

  const effectiveAthleteId = userOverride?.athleteId ?? user?.athleteId ?? null;
  const effectiveCtx = { athleteId: effectiveAthleteId };

  const [state, setState] = useState<NutritionDataState>({
    rows: [],
    goals: EMPTY_GOALS,
    refeeds: new Set(),
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (!effectiveAthleteId) {
      setState(s => ({ ...s, loading: false, error: 'Sin atleta seleccionado.' }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [rows, goals, refeeds] = await Promise.all([
        fetchNutritionHistory(effectiveCtx, 500),
        fetchGoals(effectiveCtx).catch(() => EMPTY_GOALS),
        fetchRefeeds(effectiveCtx).catch(() => new Set<string>()),
      ]);
      setState({ rows, goals, refeeds, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido.';
      setState(s => ({ ...s, loading: false, error: msg }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAthleteId]);

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAthleteId]);

  return { ...state, refetch, setState, effectiveCtx };
}
