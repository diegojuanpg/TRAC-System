import { useUser } from "@/context/UserContext";
import { buildCalculatedData, type FormData as TRACFormData } from "@/lib/tracEngine";

const SHARED_TOKEN = import.meta.env.VITE_SHARED_TOKEN as string;

export interface SubmitPayload {
  email: string;
  form_type: "morning_survey" | "nutrition";
  data: Record<string, unknown>;
}

export const useSubmitToScript = () => {
  const { user } = useUser();

  /**
   * Submit morning survey data:
   * 1. Fetch history from the coach's Data Logger
   * 2. Calculate all metrics locally (tracEngine)
   * 3. Send ALL rows (recalculated) back to the Data Logger
   */
  const submitMorningSurvey = async (formData: Record<string, unknown>): Promise<void> => {
    const scriptUrl = user?.scriptUrl;
    const sheetId = user?.sheetId;

    if (!scriptUrl || !sheetId) {
      throw new Error("Configuración de atleta no encontrada. Re-inicia sesión.");
    }

    const checkUrl = new URL(scriptUrl);
    checkUrl.searchParams.set("token", SHARED_TOKEN);
    checkUrl.searchParams.set("action", "check");
    checkUrl.searchParams.set("sheetId", sheetId);
    const checkRes = await fetch(checkUrl.toString());
    const checkJson = await checkRes.json();
    if (checkJson.success && checkJson.alreadySubmitted) {
      throw new Error("Ya completaste el check-in de hoy.");
    }

    const historyUrl = new URL(scriptUrl);
    historyUrl.searchParams.set("action", "fetchHistory");
    historyUrl.searchParams.set("token", SHARED_TOKEN);
    historyUrl.searchParams.set("sheetId", sheetId);
    historyUrl.searchParams.set("rows", "50");
    const histRes = await fetch(historyUrl.toString());
    const histJson = await histRes.json();

    if (!histJson.success || !histJson.data) {
      throw new Error("No se pudo obtener historial. Intenta de nuevo.");
    }

    const { headers, rows: historyRows } = histJson.data;

    // Step 3: Calculate all metrics locally
    const { allRows } = buildCalculatedData(
      formData as TRACFormData,
      headers,
      historyRows
    );

    // Step 4: Write ALL recalculated rows back to the sheet
    const writeUrl = new URL(scriptUrl);
    writeUrl.searchParams.set("token", SHARED_TOKEN);
    writeUrl.searchParams.set("action", "writeTRAC");
    writeUrl.searchParams.set("sheetId", sheetId);
    writeUrl.searchParams.set("rows", JSON.stringify(allRows));
    const writeRes = await fetch(writeUrl.toString());
    const writeJson = await writeRes.json();

    if (!writeJson.success) {
      throw new Error("Error al guardar datos. Intenta de nuevo.");
    }

    if (formData.bodyweight !== undefined && formData.bodyweight !== '' && formData.bodyweight !== null) {
      const bw = parseFloat(String(formData.bodyweight));
      if (isFinite(bw) && bw > 0 && bw < 500) {
        try {
          const syncUrl = new URL(scriptUrl);
          syncUrl.searchParams.set("token", SHARED_TOKEN);
          syncUrl.searchParams.set("action", "saveNutrition");
          syncUrl.searchParams.set("sheetId", sheetId);
          syncUrl.searchParams.set("data", JSON.stringify({ bodyweight: bw }));
          await fetch(syncUrl.toString());
        } catch {
          /* sync no crítico */
        }
      }
    }
  };

  /**
   * Submit nutrition data — no complex calculations needed.
   */
  const submitNutrition = async (data: Record<string, unknown>): Promise<void> => {
    const scriptUrl = user?.scriptUrl;
    const sheetId = user?.sheetId;

    if (!scriptUrl || !sheetId) {
      throw new Error("Configuración de atleta no encontrada. Re-inicia sesión.");
    }

    const saveUrl = new URL(scriptUrl);
    saveUrl.searchParams.set("token", SHARED_TOKEN);
    saveUrl.searchParams.set("action", "saveNutrition");
    saveUrl.searchParams.set("sheetId", sheetId);
    saveUrl.searchParams.set("data", JSON.stringify(data));
    const res = await fetch(saveUrl.toString());
    const json = await res.json();

    if (!json.success) {
      throw new Error("Error al guardar nutrición. Intenta de nuevo.");
    }
  };

  /**
   * Unified submit function — maintains the same interface as before.
   */
  const submit = async (payload: SubmitPayload): Promise<void> => {
    if (payload.form_type === "morning_survey") {
      await submitMorningSurvey(payload.data);
    } else if (payload.form_type === "nutrition") {
      await submitNutrition(payload.data);
    }
  };

  return { submit };
};
