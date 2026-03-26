import { useGoogleLogin } from "@react-oauth/google";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { DarkLayout } from "@/components/DarkLayout";
import { motion } from "framer-motion";

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        setUser({
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        });
        navigate("/");
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    },
    onError: () => console.error("Google login failed"),
  });

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
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-black/20"
          >
            {/* Google logo SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
        </motion.div>

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
