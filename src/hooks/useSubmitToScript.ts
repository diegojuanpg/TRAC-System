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

    const checkRes = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        token: SHARED_TOKEN,
        action: "check",
        sheetId,
      }),
    });
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
    const writeRes = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        token: SHARED_TOKEN,
        action: "writeTRAC",
        sheetId,
        rows: allRows,
      }),
    });
    const writeJson = await writeRes.json();

    if (!writeJson.success) {
      throw new Error("Error al guardar datos. Intenta de nuevo.");
    }

    if (formData.bodyweight !== undefined && formData.bodyweight !== '' && formData.bodyweight !== null) {
      const bw = parseFloat(String(formData.bodyweight));
      if (isFinite(bw) && bw > 0 && bw < 500) {
        try {
          await fetch(scriptUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              token: SHARED_TOKEN,
              action: "saveNutrition",
              sheetId,
              data: { bodyweight: bw },
            }),
          });
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

    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        token: SHARED_TOKEN,
        action: "saveNutrition",
        sheetId,
        data,
      }),
    });
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
