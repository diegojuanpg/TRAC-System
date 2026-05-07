import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, LogOut, Users } from "lucide-react";
import { useUser, AthleteEntry } from "@/context/UserContext";
import { DarkLayout } from "@/components/DarkLayout";
import NutritionDashboard from "./NutritionDashboard";

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT  = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const glassPanel = {
  background: "linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, hsla(0,0%,100%,0.03) 100%)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid hsla(0,0%,100%,0.12)",
  boxShadow: "0 6px 20px hsla(0,0%,0%,0.28), inset 0 1px 0 hsla(0,0%,100%,0.2)",
} as const;

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

interface AthleteCardProps {
  athlete: AthleteEntry;
  onClick: () => void;
}

const AthleteCard = ({ athlete, onClick }: AthleteCardProps) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="w-full text-left rounded-2xl p-3.5 flex items-center gap-3 transition-colors"
    style={glassPanel}
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-white/80"
      style={{ background: "hsla(0,0%,100%,0.1)", border: "1px solid hsla(0,0%,100%,0.15)", fontFamily: JAKARTA }}
    >
      {initials(athlete.name)}
    </div>
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-white truncate" style={{ fontFamily: JAKARTA }}>
        {athlete.name}
      </p>
      <p className="text-[10px] text-white/40 truncate" style={{ fontFamily: JAKARTA }}>
        {athlete.email}
      </p>
    </div>
    <ChevronLeft className="w-3.5 h-3.5 text-white/25 ml-auto rotate-180 flex-shrink-0" />
  </motion.button>
);

export default function AdminDashboard() {
  const { user, setUser } = useUser();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AthleteEntry | null>(null);

  const athletes = user?.athletes ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return athletes;
    return athletes.filter(
      a => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }, [athletes, search]);

  // Show athlete's NutritionDashboard when one is selected
  if (selected) {
    return (
      <NutritionDashboard
        athleteOverride={{
          scriptUrl: selected.scriptUrl,
          sheetId: selected.sheetId,
          athleteName: selected.name,
          email: selected.email,
        }}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <DarkLayout>
      {/* Top-right: logout */}
      <div className="fixed top-5 right-5 z-40">
        <button
          onClick={() => setUser(null)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/45 hover:text-white transition-colors"
          style={{ background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)" }}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative z-10 px-4 py-10 pt-16 max-w-2xl mx-auto pb-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-2"
        >
          <Users className="w-4 h-4 text-white/35" />
          <h1 className="text-[36px] leading-none font-semibold text-white" style={{ fontFamily: OUTFIT, letterSpacing: "-0.03em" }}>
            Atletas
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-[12px] text-white/35 mb-8"
          style={{ fontFamily: JAKARTA }}
        >
          {athletes.length} atletas registrados · Coach: {user?.email}
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl pl-9 pr-4 py-3 text-[13px] text-white placeholder-white/25 outline-none transition-all"
            style={{
              fontFamily: JAKARTA,
              background: "hsla(0,0%,100%,0.06)",
              border: "1px solid hsla(0,0%,100%,0.1)",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.3)")}
            onBlur={e => (e.currentTarget.style.borderColor = "hsla(0,0%,100%,0.1)")}
          />
        </motion.div>

        {/* Athlete list */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-[12px] text-white/30 py-12"
              style={{ fontFamily: JAKARTA }}
            >
              {search ? "Sin resultados." : "Sin atletas registrados."}
            </motion.p>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {filtered.map((athlete, i) => (
                <motion.div
                  key={athlete.email}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <AthleteCard athlete={athlete} onClick={() => setSelected(athlete)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DarkLayout>
  );
}
