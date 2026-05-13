/**
 * Submit hook — Supabase backend.
 * Morning survey: fetches history → recomputes all metrics client-side → upserts.
 */

import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { buildCalculatedData, type FormData as TRACFormData } from "@/lib/tracEngine";
import {
  TRAC_HEADERS, HEADER_TO_DB, dbRowToDataRow, dataRowToDbRow, isoDateToSerial,
} from "@/lib/tracDbMapping";

export interface SubmitPayload {
  email: string;
  form_type: "morning_survey" | "nutrition";
  data: Record<string, unknown>;
}

const DATE_COL = HEADER_TO_DB['Date']; // 'date'

export const useSubmitToScript = () => {
  const { user } = useUser();

  const submitMorningSurvey = async (formData: Record<string, unknown>): Promise<void> => {
    const athleteId = user?.athleteId;
    if (!athleteId) throw new Error("Atleta no configurado. Re-inicia sesión.");

    // 1. Already submitted today?
    const today = new Date().toISOString().slice(0, 10);
    const { data: existingToday } = await supabase
      .from('trac_entries')
      .select('date')
      .eq('athlete_id', athleteId)
      .eq('date', today)
      .maybeSingle();
    if (existingToday) throw new Error("Ya completaste el check-in de hoy.");

    // 2. Fetch history (last 50 rows)
    const { data: historyRows, error: histErr } = await supabase
      .from('trac_entries')
      .select('*')
      .eq('athlete_id', athleteId)
      .order(DATE_COL, { ascending: false })
      .limit(50);
    if (histErr) throw new Error("No se pudo obtener historial. Intenta de nuevo.");

    const history = (historyRows ?? [])
      .reverse()
      .map(r => dbRowToDataRow(r as Record<string, unknown>));

    // 3. Recompute everything client-side
    const { allRows } = buildCalculatedData(formData as TRACFormData, TRAC_HEADERS, history);

    // 4. Upsert all rows back
    const dbRows = allRows.map(row => dataRowToDbRow(row, athleteId));
    const { error: writeErr } = await supabase
      .from('trac_entries')
      .upsert(dbRows, { onConflict: 'athlete_id,date' });
    if (writeErr) throw new Error("Error al guardar datos: " + writeErr.message);

    // 5. Sync bodyweight to nutrition_entries
    if (formData.bodyweight !== undefined && formData.bodyweight !== '' && formData.bodyweight !== null) {
      const bw = parseFloat(String(formData.bodyweight));
      if (isFinite(bw) && bw > 0 && bw < 500) {
        await supabase
          .from('nutrition_entries')
          .upsert(
            { athlete_id: athleteId, date: today, bodyweight: bw },
            { onConflict: 'athlete_id,date' },
          );
      }
    }
  };

  const submitNutrition = async (data: Record<string, unknown>): Promise<void> => {
    const athleteId = user?.athleteId;
    if (!athleteId) throw new Error("Atleta no configurado. Re-inicia sesión.");

    const today = new Date().toISOString().slice(0, 10);
    const clean: Record<string, unknown> = { athlete_id: athleteId, date: today };
    for (const [k, v] of Object.entries(data)) {
      if (v === null || v === '' || v === undefined) continue;
      clean[k] = v;
    }
    const { error } = await supabase
      .from('nutrition_entries')
      .upsert(clean, { onConflict: 'athlete_id,date' });
    if (error) throw new Error("Error al guardar nutrición: " + error.message);
  };

  const submit = async (payload: SubmitPayload): Promise<void> => {
    if (payload.form_type === "morning_survey") {
      await submitMorningSurvey(payload.data);
    } else if (payload.form_type === "nutrition") {
      await submitNutrition(payload.data);
    }
  };

  // Avoid unused warning
  void isoDateToSerial;

  return { submit };
};
