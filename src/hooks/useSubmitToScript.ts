const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const SHARED_TOKEN = import.meta.env.VITE_SHARED_TOKEN as string;

export interface SubmitPayload {
  email: string;
  form_type: "morning_survey" | "nutrition";
  data: Record<string, unknown>;
}

export const useSubmitToScript = () => {
  const submit = async (payload: SubmitPayload): Promise<void> => {
    if (!SCRIPT_URL) {
      console.warn("VITE_APPS_SCRIPT_URL not configured — logging data locally:");
      console.log(payload);
      return;
    }

    // Map form_type to the action name Script B expects
    const action = payload.form_type === "morning_survey" ? "save" : "saveNutrition";

    // Script B's expected contract: { token, action, email, data }
    const body = {
      token: SHARED_TOKEN,
      action,
      email: payload.email,
      data: payload.data,
    };

    // 'no-cors' is required: Apps Script doesn't return CORS headers.
    // The POST reaches the script correctly even though the response is opaque.
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  return { submit };
};
