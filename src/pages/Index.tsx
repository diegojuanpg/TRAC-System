import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Activity, Utensils, LineChart } from "lucide-react";
import { DarkLayout } from "@/components/DarkLayout";
import { useUser } from "@/context/UserContext";

const CARDS = [
  {
    route: '/monitoring',
    icon: LineChart,
    title: 'Dashboard',
    desc: 'Analiza tus métricas y estado de forma.',
    color: '#38bdf8',       // sky-400
    bg: 'rgba(56,189,248,0.06)',
    bgHover: 'rgba(56,189,248,0.10)',
    border: 'rgba(56,189,248,0.12)',
    borderHover: 'rgba(56,189,248,0.24)',
    iconBg: 'rgba(56,189,248,0.12)',
    iconBorder: 'rgba(56,189,248,0.20)',
  },
  {
    route: '/morning',
    icon: Activity,
    title: 'Morning Survey',
    desc: 'Cuestionario de bienestar matinal.',
    color: '#a78bfa',       // violet-400
    bg: 'rgba(167,139,250,0.06)',
    bgHover: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.12)',
    borderHover: 'rgba(167,139,250,0.24)',
    iconBg: 'rgba(167,139,250,0.12)',
    iconBorder: 'rgba(167,139,250,0.20)',
  },
  {
    route: '/nutrition',
    icon: Utensils,
    title: 'Nutrition',
    desc: 'Registra calorías, macros y actividad.',
    color: '#34d399',       // emerald-400
    bg: 'rgba(52,211,153,0.06)',
    bgHover: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.12)',
    borderHover: 'rgba(52,211,153,0.24)',
    iconBg: 'rgba(52,211,153,0.12)',
    iconBorder: 'rgba(52,211,153,0.20)',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const firstName = user?.name?.split(' ')[0] || user?.athleteName?.split(' ')[0];

  return (
    <DarkLayout className="flex flex-col items-center justify-center px-5">
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="font-mono text-[10px] tracking-[0.22em] text-white/25 uppercase mb-3">
            TRAC · Athlete Central
          </p>
          <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight text-foreground/95 leading-tight">
            {firstName ? `Hola, ${firstName}` : 'Athlete Central'}
          </h1>
          <p className="text-sm text-white/35 mt-1.5 leading-snug">
            ¿Cómo te encuentras hoy?
          </p>
        </motion.div>

        <div className="space-y-2.5">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.route}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
                onClick={() => navigate(card.route)}
                className="w-full rounded-xl p-4 flex items-center gap-4 text-left transition-colors duration-200"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = card.bgHover;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = card.borderHover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = card.bg;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = card.border;
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: card.iconBg,
                    border: `1px solid ${card.iconBorder}`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: card.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground/90 mb-0.5">
                    {card.title}
                  </div>
                  <div className="text-xs text-white/35 leading-snug">
                    {card.desc}
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0"
                  style={{ color: `${card.color}60` }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </DarkLayout>
  );
};

export default Index;
