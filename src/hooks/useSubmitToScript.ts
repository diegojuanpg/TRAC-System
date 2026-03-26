const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

export interface SubmitPayload {
  email: string;
  form_type: "morning_survey" | "nutrition";
  timestamp: string;
  payload: Record<string, unknown>;
}

export const useSubmitToScript = () => {
  const submit = async (data: SubmitPayload): Promise<void> => {
    if (!SCRIPT_URL) {
      console.warn("VITE_APPS_SCRIPT_URL not configured — logging data locally:");
      console.log(data);
      return;
    }
    // 'no-cors' is required because Apps Script doesn't return CORS headers.
    // The POST request DOES reach the script even though the response is opaque.
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return { submit };
};
