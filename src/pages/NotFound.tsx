import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { DarkLayout } from "@/components/DarkLayout";
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <DarkLayout className="flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard>
          <div className="px-8 py-10 text-center">
            <div className="relative inline-block mb-3">
              <div
                className="absolute inset-0 blur-2xl pointer-events-none"
                style={{ background: 'hsla(0,0%,100%,0.18)', transform: 'scale(1.2)' }}
                aria-hidden="true"
              />
              <h1
                className="relative text-[72px] leading-none text-white"
                style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.04em' }}
              >
                404
              </h1>
            </div>
            <p
              className="text-[14px] text-white/65 mb-8"
              style={{ fontFamily: JAKARTA }}
            >
              Página no encontrada.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
              style={{
                fontFamily: JAKARTA,
                background:
                  'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.06) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1.5px solid hsla(0,0%,100%,0.4)',
                boxShadow:
                  '0 6px 18px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.35)',
              }}
            >
              Volver al inicio
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </DarkLayout>
  );
};

export default NotFound;
