import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const clientRef = useRef<any>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mouse-parallax tilt
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [3, -3]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-3, 3]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  useEffect(() => {
    const init = () => {
      if (!window.google || !CLIENT_ID) return;

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

            const { scriptUrl, sheetId, athleteName, isAdmin, athletes } = routerJson.data;

            setUser({
              email: profile.email,
              name: profile.name || athleteName,
              picture: profile.picture,
              scriptUrl,
              sheetId,
              athleteName,
              isAdmin: !!isAdmin,
              athletes: athletes ?? [],
            });

            navigate(isAdmin ? "/admin" : "/");
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
    <div
      className="min-h-[100dvh] w-full relative overflow-hidden flex items-center justify-center px-5 bg-black"
      style={{ fontFamily: JAKARTA }}
    >
      {/* Animated pure-white blurred lights */}
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '55vmax',
          height: '55vmax',
          top: '-18vmax',
          left: '-10vmax',
          background: 'radial-gradient(circle, hsla(0,0%,100%,0.45) 0%, hsla(0,0%,100%,0.12) 32%, transparent 68%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, 90, -40, 70, 0],
          y: [0, 70, 130, 50, 0],
          scale: [1, 1.15, 0.95, 1.12, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '50vmax',
          height: '50vmax',
          bottom: '-18vmax',
          right: '-14vmax',
          background: 'radial-gradient(circle, hsla(0,0%,100%,0.4) 0%, hsla(0,0%,100%,0.1) 35%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -70, 40, -90, 0],
          y: [0, -60, -110, -30, 0],
          scale: [1, 1.12, 1.22, 0.95, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '40vmax',
          height: '40vmax',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, hsla(0,0%,100%,0.32) 0%, hsla(0,0%,100%,0.08) 40%, transparent 72%)',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [-30, 50, -20, 40, -30],
          y: [-20, 40, 70, 10, -20],
          scale: [1, 1.22, 0.9, 1.18, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '32vmax',
          height: '32vmax',
          bottom: '8%',
          left: '15%',
          background: 'radial-gradient(circle, hsla(0,0%,100%,0.28) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, 60, -30, 20, 0],
          y: [0, -50, 20, -70, 0],
          scale: [1, 1.1, 1.28, 0.95, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grain */}
      <div
        className="noise-overlay fixed inset-0 pointer-events-none"
        style={{ opacity: 0.035, zIndex: 1 }}
        aria-hidden="true"
      />

      {/* Liquid Glass card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="relative rounded-[32px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_30px_90px_-10px_hsla(0,0%,0%,0.7),0_14px_40px_-8px_hsla(0,0%,0%,0.5)]"
          style={{
            background:
              'linear-gradient(135deg, hsla(0,0%,100%,0.14) 0%, hsla(0,0%,100%,0.04) 55%, hsla(0,0%,100%,0.09) 100%)',
            backdropFilter: 'blur(44px) saturate(170%)',
            WebkitBackdropFilter: 'blur(44px) saturate(170%)',
            border: '1px solid hsla(0,0%,100%,0.2)',
            boxShadow:
              '0 24px 70px -10px hsla(0,0%,0%,0.6), 0 10px 30px -8px hsla(0,0%,0%,0.4), inset 0 1px 0 hsla(0,0%,100%,0.3), inset 0 0 0 1px hsla(0,0%,100%,0.06), inset 0 -1px 0 hsla(0,0%,100%,0.05)',
          }}
        >
          {/* Top highlight sheen */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, hsla(0,0%,100%,0.6) 50%, transparent 100%)',
            }}
          />
          {/* Inner radial sheen */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 85% 45% at 50% 0%, hsla(0,0%,100%,0.14) 0%, transparent 62%)',
            }}
          />

          <div className="relative px-8 py-9">
            {/* Top row labels */}
            <div className="flex items-center justify-between mb-8">
              <span
                className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
                style={{ fontFamily: JAKARTA }}
              >
                Athlete Monitoring
              </span>
              <span
                className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
                style={{ fontFamily: JAKARTA }}
              >
                TRAC
              </span>
            </div>

            {/* Title */}
            <div className="relative inline-block mb-2">
              <div
                className="absolute inset-0 blur-2xl pointer-events-none"
                style={{
                  background: 'hsla(0,0%,100%,0.18)',
                  transform: 'scale(1.15)',
                }}
                aria-hidden="true"
              />
              <h1
                className="relative text-[52px] leading-[1.0] text-white"
                style={{
                  fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                }}
              >
                Log In
              </h1>
            </div>
            <p
              className="text-[13px] text-white/65 mb-6 whitespace-nowrap"
              style={{ fontFamily: JAKARTA }}
            >
              Bienvenido de vuelta. Por favor, inicia sesión en tu cuenta.
            </p>

            {/* Google pill button — outlined liquid glass */}
            <motion.button
              onClick={handleLogin}
              disabled={loading}
              whileHover={{ scale: 1.03, boxShadow: '0 10px 30px hsla(0,0%,0%,0.4), inset 0 1px 0 hsla(0,0%,100%,0.45)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-full relative flex items-center justify-center gap-3 font-semibold text-[15px] px-6 py-4 rounded-full text-white disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
              style={{
                fontFamily: JAKARTA,
                background: 'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1.5px solid hsla(0,0%,100%,0.4)',
                boxShadow:
                  '0 6px 18px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.35)',
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-4 top-0 h-px opacity-70"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.7), transparent)',
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
            </motion.button>

            {/* Error */}
            {loginError && !loginError.includes('VITE_GOOGLE_CLIENT_ID') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl p-3 text-center mt-5"
                style={{
                  background: 'hsla(0,70%,50%,0.12)',
                  border: '1px solid hsla(0,70%,60%,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-[13px] text-red-300" style={{ fontFamily: JAKARTA }}>
                  {loginError}
                </p>
              </motion.div>
            )}

            {/* Divider */}
            <div
              aria-hidden="true"
              className="h-px mt-6 mb-4"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, hsla(0,0%,100%,0.12) 50%, transparent 100%)',
              }}
            />

            <p
              className="text-center text-[12px] text-white/50"
              style={{ fontFamily: JAKARTA }}
            >
              Utiliza la misma cuenta que en tu Sheet
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
