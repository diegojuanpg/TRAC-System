import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { DarkLayout } from "@/components/DarkLayout";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Google Identity Services is loaded via script tag in index.html
declare global {
  interface Window {
    google: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const ROUTER_URL = import.meta.env.VITE_ROUTER_SCRIPT_URL as string;
const SHARED_TOKEN = import.meta.env.VITE_SHARED_TOKEN as string;

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const clientRef = useRef<any>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait for the GIS script to load (loaded in index.html)
    const init = () => {
      if (!window.google) return;
      
      if (!CLIENT_ID) {
        console.error("Missing VITE_GOOGLE_CLIENT_ID in .env");
        setLoginError("Falta configurar VITE_GOOGLE_CLIENT_ID en el archivo .env local.");
        return;
      }

      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid email profile",
        callback: async (response: any) => {
          setLoading(true);
          setLoginError(null);
          try {
            // Step 1: Get Google profile
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const profile = await res.json();
            const email = profile.email;

            // Step 2: Look up athlete in the allowed list via Router Script
            const routerUrl = new URL(ROUTER_URL);
            routerUrl.searchParams.set("action", "lookup");
            routerUrl.searchParams.set("token", SHARED_TOKEN);
            routerUrl.searchParams.set("email", email);

            const routerRes = await fetch(routerUrl.toString());
            const routerJson = await routerRes.json();

            if (!routerJson.success || !routerJson.data) {
              setLoginError(
                routerJson.error || "Tu cuenta no está autorizada. Contacta a tu coach."
              );
              setLoading(false);
              return;
            }

            const { scriptUrl, sheetId, athleteName } = routerJson.data;

            // Step 3: Save user with routing info
            setUser({
              email: profile.email,
              name: profile.name || athleteName,
              picture: profile.picture,
              scriptUrl,
              sheetId,
              athleteName,
            });

            navigate("/");
          } catch (err) {
            console.error("Error during login:", err);
            setLoginError("Error de conexión. Intenta de nuevo.");
          } finally {
            setLoading(false);
          }
        },
      });
    };

    if (window.google) {
      init();
    } else {
      // Poll until GIS script is ready
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); init(); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [setUser, navigate]);

  const handleLogin = () => {
    setLoginError(null);
    clientRef.current?.requestAccessToken();
  };

  return (
    <DarkLayout className="flex flex-col items-center justify-center px-5">
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="font-mono text-[11px] font-bold tracking-[0.28em] text-muted-foreground/40 uppercase mb-3">
            Training Readiness
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            TRAC
          </h1>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Assessment Center
          </p>
        </motion.div>

        {/* Login button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full"
        >
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Verificando acceso...
              </>
            ) : (
              <>
                {/* Google logo SVG */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>
        </motion.div>

        {/* Error message */}
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3.5 text-center"
          >
            <p className="text-sm text-red-400">{loginError}</p>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-[11px] text-muted-foreground/30 text-center"
        >
          Solo acceden las cuentas autorizadas
        </motion.p>
      </div>
    </DarkLayout>
  );
};

export default Login;
