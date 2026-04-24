import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
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
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const profile = await res.json();
            const email = profile.email;

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
    <div className="min-h-[100dvh] w-full relative overflow-hidden flex items-center justify-center px-5 bg-[#07070b]">
      {/* Animated blurred light blobs — white tones */}
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '60vmax',
          height: '60vmax',
          top: '-20vmax',
          left: '-10vmax',
          background: 'radial-gradient(circle, hsla(0,0%,100%,0.28) 0%, hsla(0,0%,100%,0.08) 35%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 80, -40, 60, 0],
          y: [0, 60, 120, 40, 0],
          scale: [1, 1.15, 0.95, 1.1, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '55vmax',
          height: '55vmax',
          bottom: '-20vmax',
          right: '-15vmax',
          background: 'radial-gradient(circle, hsla(210,20%,95%,0.22) 0%, hsla(210,20%,95%,0.06) 40%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, -60, 40, -80, 0],
          y: [0, -50, -100, -30, 0],
          scale: [1, 1.1, 1.2, 0.95, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '40vmax',
          height: '40vmax',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, hsla(0,0%,100%,0.18) 0%, hsla(0,0%,100%,0.04) 45%, transparent 75%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [-30, 40, -20, 30, -30],
          y: [-20, 30, 60, 10, -20],
          scale: [1, 1.2, 0.9, 1.15, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '35vmax',
          height: '35vmax',
          bottom: '10%',
          left: '20%',
          background: 'radial-gradient(circle, hsla(220,15%,90%,0.14) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [0, 50, -30, 20, 0],
          y: [0, -40, 20, -60, 0],
          scale: [1, 1.1, 1.25, 0.95, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grain texture */}
      <div
        className="noise-overlay fixed inset-0 pointer-events-none"
        style={{ opacity: 0.03, zIndex: 1 }}
        aria-hidden="true"
      />

      {/* Liquid Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div
          className="relative rounded-[28px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsla(0,0%,100%,0.12) 0%, hsla(0,0%,100%,0.04) 100%)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid hsla(0,0%,100%,0.18)',
            boxShadow:
              '0 20px 60px -10px hsla(0,0%,0%,0.5), 0 8px 24px -8px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.25), inset 0 -1px 0 hsla(0,0%,100%,0.05)',
          }}
        >
          {/* Top highlight sheen */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, hsla(0,0%,100%,0.5) 50%, transparent 100%)',
            }}
          />
          {/* Inner radial sheen */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 40% at 50% 0%, hsla(0,0%,100%,0.12) 0%, transparent 60%)',
            }}
          />

          <div className="relative flex flex-col items-center gap-8 px-8 py-10">
            {/* Logo */}
            <div className="text-center">
              <div className="font-mono text-[10px] font-semibold tracking-[0.26em] text-white/45 uppercase mb-3">
                Training Readiness
              </div>
              <div className="relative inline-block">
                <div
                  className="absolute inset-0 blur-2xl rounded-full"
                  style={{ background: 'hsla(0,0%,100%,0.2)', transform: 'scale(1.4)' }}
                  aria-hidden="true"
                />
                <h1 className="relative text-5xl font-bold tracking-[-0.02em] text-white">
                  TRAC
                </h1>
              </div>
              <p className="text-[13px] text-white/60 mt-3 tracking-wide">
                Sistema de monitoreo atlético
              </p>
            </div>

            {/* Login button — glass pill */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-3 font-medium text-sm px-6 py-3.5 rounded-2xl text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, hsla(0,0%,100%,0.18) 0%, hsla(0,0%,100%,0.08) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid hsla(0,0%,100%,0.25)',
                boxShadow:
                  '0 4px 16px hsla(0,0%,0%,0.25), inset 0 1px 0 hsla(0,0%,100%,0.3)',
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-3 top-0 h-px opacity-70"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.6), transparent)',
                }}
              />
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Verificando acceso...
                </>
              ) : (
                <>
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

            {/* Error */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl p-3.5 text-center"
                style={{
                  background: 'hsla(0,70%,50%,0.12)',
                  border: '1px solid hsla(0,70%,60%,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-sm text-red-300">{loginError}</p>
              </motion.div>
            )}

            <p className="text-[11px] text-white/40 text-center">
              Solo acceden las cuentas autorizadas
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
