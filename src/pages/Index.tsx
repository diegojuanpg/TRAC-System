import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Apple, LogOut, HeartPulse, Users } from "lucide-react";
import { useUser } from "@/context/UserContext";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const ATHLETE_CARDS = [
  {
    route: '/monitoring',
    icon: HeartPulse,
    title: 'Readiness Dashboard',
    desc: 'Analiza tu fatiga y recuperación.',
  },
  {
    route: '/nutrition',
    icon: Apple,
    title: 'Nutrition Dashboard',
    desc: 'Prescripción y registro nutricional.',
  },
];

const ADMIN_CARD = {
  route: '/admin',
  icon: Users,
  title: 'Admin Panel',
  desc: 'Gestiona tus atletas y sus dashboards.',
};

const Index = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  if (!user) {
    navigate('/login');
    return null;
  }

  const CARDS = user.isAdmin ? [ADMIN_CARD, ...ATHLETE_CARDS] : ATHLETE_CARDS;

  const firstName = user?.name?.split(' ')[0] || user?.athleteName?.split(' ')[0];

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <div
      className="min-h-[100dvh] w-full relative overflow-hidden flex flex-col items-center justify-center px-5 bg-black"
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

      {/* Logout button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        className="absolute right-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white transition-colors"
        style={{
          top: 'max(1.25rem, env(safe-area-inset-top, 1.25rem))',
          fontFamily: JAKARTA,
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.1) 0%, hsla(0,0%,100%,0.04) 100%)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid hsla(0,0%,100%,0.18)',
          boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.25)',
        }}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Salir</span>
      </motion.button>

      {/* Main glass card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="relative rounded-[32px] overflow-hidden"
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
            {/* Top row label */}
            <div className="flex items-center justify-between mb-8">
              <span
                className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
                style={{ fontFamily: JAKARTA }}
              >
                Athlete Central
              </span>
              <span
                className="text-[11px] font-semibold tracking-[0.18em] text-white/70"
                style={{ fontFamily: JAKARTA }}
              >
                TRAC
              </span>
            </div>

            {/* Greeting */}
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
                className="relative text-[44px] leading-[1.0] text-white"
                style={{
                  fontFamily: OUTFIT,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                }}
              >
                {firstName ? `Hola, ${firstName}` : 'Hola'}
              </h1>
            </div>
            <p
              className="text-[13px] text-white/65 mb-8"
              style={{ fontFamily: JAKARTA }}
            >
              ¿Cómo te encuentras hoy?
            </p>

            {/* Cards — monochrome glass */}
            <div className="space-y-2.5">
              {CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.route}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{
                      scale: 1.02,
                      transition: { type: 'spring', stiffness: 300, damping: 22 },
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(card.route)}
                    className="w-full relative rounded-2xl p-4 flex items-center gap-4 text-left overflow-hidden group"
                    style={{
                      fontFamily: JAKARTA,
                      background:
                        'linear-gradient(135deg, hsla(0,0%,100%,0.09) 0%, hsla(0,0%,100%,0.03) 100%)',
                      backdropFilter: 'blur(20px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                      border: '1px solid hsla(0,0%,100%,0.14)',
                      boxShadow:
                        '0 4px 16px hsla(0,0%,0%,0.25), inset 0 1px 0 hsla(0,0%,100%,0.22)',
                    }}
                  >
                    {/* Top edge sheen */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 top-0 h-px opacity-60"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, hsla(0,0%,100%,0.5), transparent)',
                      }}
                    />

                    {/* Icon — monochrome glass */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background:
                          'linear-gradient(135deg, hsla(0,0%,100%,0.16) 0%, hsla(0,0%,100%,0.05) 100%)',
                        border: '1px solid hsla(0,0%,100%,0.22)',
                        boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.28)',
                      }}
                    >
                      <Icon className="h-5 w-5 text-white/90" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[14px] font-semibold text-white mb-0.5"
                        style={{ fontFamily: JAKARTA, letterSpacing: '-0.01em' }}
                      >
                        {card.title}
                      </div>
                      <div
                        className="text-[12px] text-white/55 leading-snug"
                        style={{ fontFamily: JAKARTA }}
                      >
                        {card.desc}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-white/40 group-hover:text-white/70 transition-colors" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
