import { supabase } from '@/lib/supabase';

export interface TrainingSession {
  id: string;
  athlete_id: string;
  date: string;        // YYYY-MM-DD
  rpe: number;
  duration_min: number;
  srpe: number;
}

export async function fetchSessions(
  athleteId: string,
  fromDate: string,
  toDate: string,
): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('id, athlete_id, date, rpe, duration_min, srpe')
    .eq('athlete_id', athleteId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TrainingSession[];
}

export async function upsertSession(params: {
  athleteId: string;
  date: string;
  rpe: number;
  duration_min: number;
}): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from('training_sessions')
    .upsert(
      {
        athlete_id: params.athleteId,
        date: params.date,
        rpe: params.rpe,
        duration_min: params.duration_min,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'athlete_id,date' },
    )
    .select('id, athlete_id, date, rpe, duration_min, srpe')
    .single();
  if (error) throw new Error(error.message);
  return data as TrainingSession;
}

export async function deleteSession(athleteId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('athlete_id', athleteId)
    .eq('date', date);
  if (error) throw new Error(error.message);
}
