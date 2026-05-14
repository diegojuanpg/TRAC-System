import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  TrainingSession,
  fetchSessions,
  upsertSession,
  deleteSession,
} from '@/lib/trainingApi';
import { srpeColor, srpeLabel, computeSrpe } from '@/lib/srpe';

const JAKARTA = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const OUTFIT = "'Outfit', 'Plus Jakarta Sans', sans-serif";

const glass = {
  background:
    'linear-gradient(135deg, hsla(0,0%,100%,0.12) 0%, hsla(0,0%,100%,0.04) 100%)',
  backdropFilter: 'blur(28px) saturate(170%)',
  WebkitBackdropFilter: 'blur(28px) saturate(170%)',
  border: '1px solid hsla(0,0%,100%,0.16)',
  boxShadow:
    '0 6px 22px hsla(0,0%,0%,0.32), inset 0 1px 0 hsla(0,0%,100%,0.25)',
} as const;

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DOW_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  athleteId: string;
  // Coach can edit any date; athlete only today (for updates) and last 7 days (for inserts).
  coachMode?: boolean;
}

interface SessionModalProps {
  open: boolean;
  date: string;
  existing: TrainingSession | null;
  canEdit: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (rpe: number, duration: number) => Promise<void>;
  onDelete: () => Promise<void>;
}

const SessionModal = ({ open, date, existing, canEdit, saving, onClose, onSave, onDelete }: SessionModalProps) => {
  const [rpe, setRpe] = useState<number>(existing?.rpe ?? 7);
  const [duration, setDuration] = useState<number>(existing?.duration_min ?? 90);

  useEffect(() => {
    setRpe(existing?.rpe ?? 7);
    setDuration(existing?.duration_min ?? 90);
  }, [existing, open]);

  const srpe = computeSrpe(rpe, duration);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          style={{ background: 'hsla(0,0%,0%,0.65)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-[28px] p-6"
            style={glass}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase mb-1" style={{ fontFamily: JAKARTA }}>
                  Sesión
                </p>
                <h3 className="text-[20px] text-white" style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
              </div>
              <button onClick={onClose} className="text-white/45 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!canEdit && (
              <p className="text-[12px] text-white/55 mb-3 leading-relaxed" style={{ fontFamily: JAKARTA }}>
                Solo podés ver esta sesión. Editás únicamente las de hoy.
              </p>
            )}

            {/* RPE */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] tracking-[0.16em] text-white/55 uppercase" style={{ fontFamily: JAKARTA }}>RPE</span>
                <span className="text-[20px] text-white tabular-nums" style={{ fontFamily: OUTFIT, fontWeight: 600 }}>
                  {rpe}<span className="text-white/40 text-[12px]"> / 10</span>
                </span>
              </div>
              <input
                type="range" min={0} max={10} step={1} value={rpe}
                disabled={!canEdit}
                onChange={e => setRpe(parseInt(e.target.value))}
                className="w-full accent-white"
              />
              <p className="text-[10px] text-white/40 mt-1" style={{ fontFamily: JAKARTA }}>0 = descanso · 10 = esfuerzo máximo</p>
            </div>

            {/* Duration */}
            <div className="mb-5">
              <span className="text-[11px] tracking-[0.16em] text-white/55 uppercase block mb-2" style={{ fontFamily: JAKARTA }}>Duración</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(duration)}
                  disabled={!canEdit}
                  onFocus={e => e.target.select()}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    const n = cleaned === '' ? 0 : parseInt(cleaned, 10);
                    setDuration(Math.min(n, 600));
                  }}
                  className="w-full rounded-xl px-4 py-3 text-[15px] text-white outline-none tabular-nums"
                  style={{
                    fontFamily: JAKARTA,
                    background: 'hsla(0,0%,100%,0.06)',
                    border: '1px solid hsla(0,0%,100%,0.12)',
                  }}
                />
                <span className="text-[12px] text-white/50" style={{ fontFamily: JAKARTA }}>min</span>
              </div>
            </div>

            {/* sRPE preview */}
            <div
              className="rounded-2xl px-4 py-3 mb-5 flex items-center justify-between"
              style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}
            >
              <div>
                <p className="text-[10px] tracking-[0.16em] text-white/40 uppercase" style={{ fontFamily: JAKARTA }}>sRPE</p>
                <p className="text-[22px] text-white tabular-nums" style={{ fontFamily: OUTFIT, fontWeight: 600 }}>{srpe}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: srpeColor(srpe), boxShadow: `0 0 12px ${srpeColor(srpe)}80` }} />
                <span className="text-[12px] text-white/65" style={{ fontFamily: JAKARTA }}>{srpeLabel(srpe)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {existing && canEdit && (
                <button
                  onClick={onDelete}
                  disabled={saving}
                  className="px-4 py-3 rounded-full text-[12px] text-red-300/80 hover:text-red-300 disabled:opacity-40"
                  style={{ fontFamily: JAKARTA, background: 'hsla(0,75%,55%,0.08)', border: '1px solid hsla(0,75%,55%,0.2)' }}
                >
                  Borrar
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onSave(rpe, duration)}
                  disabled={saving}
                  className="flex-1 py-3 rounded-full text-[13px] font-semibold text-white disabled:opacity-50"
                  style={{
                    fontFamily: JAKARTA,
                    background: 'linear-gradient(135deg, hsla(0,0%,100%,0.18) 0%, hsla(0,0%,100%,0.06) 100%)',
                    border: '1.5px solid hsla(0,0%,100%,0.4)',
                    boxShadow: 'inset 0 1px 0 hsla(0,0%,100%,0.3)',
                  }}
                >
                  {saving ? 'Guardando…' : existing ? 'Actualizar' : 'Guardar'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function TrainingCalendar({ athleteId, coachMode = false }: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(today));
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayISO = toISO(today);

  const reload = async () => {
    setLoading(true);
    setError(null);
    const from = toISO(addMonths(viewMonth, -1));
    const to = toISO(addMonths(viewMonth, 2));
    try {
      const rows = await fetchSessions(athleteId, from, to);
      setSessions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar sesiones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, viewMonth.getTime()]);

  const sessionMap = useMemo(() => {
    const m = new Map<string, TrainingSession>();
    for (const s of sessions) m.set(s.date, s);
    return m;
  }, [sessions]);

  // Build grid cells (Mon-Sun)
  const cells = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const firstDow = (first.getDay() + 6) % 7; // 0=Mon
    const lastDow = (last.getDay() + 6) % 7;
    const lead = firstDow; // empty cells at start
    const trail = 6 - lastDow;
    const days: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    for (let i = 0; i < trail; i++) days.push(null);
    return days;
  }, [viewMonth]);

  const canEditDate = (dateISO: string): boolean => {
    if (coachMode) return true;
    const days = daysBetween(new Date(todayISO + 'T00:00:00'), new Date(dateISO + 'T00:00:00'));
    // Athlete: insert allowed [-7, 0]; update only at 0
    const existing = sessionMap.has(dateISO);
    if (existing) return days === 0;
    return days <= 0 && days >= -7;
  };

  const handleDayClick = (d: Date) => {
    const iso = toISO(d);
    setSelectedDate(iso);
    setModalOpen(true);
  };

  const handleSave = async (rpe: number, duration: number) => {
    if (!selectedDate) return;
    setSaving(true);
    setError(null);
    try {
      await upsertSession({ athleteId, date: selectedDate, rpe, duration_min: duration });
      await reload();
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    setSaving(true);
    setError(null);
    try {
      await deleteSession(athleteId, selectedDate);
      await reload();
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.');
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  const existing = selectedDate ? sessionMap.get(selectedDate) ?? null : null;
  const canEditSelected = selectedDate ? canEditDate(selectedDate) : false;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-[26px] p-4 sm:p-5" style={glass}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewMonth(addMonths(viewMonth, -1))}
            aria-label="Mes anterior"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/65 hover:text-white"
            style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.1)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-[15px] text-white capitalize" style={{ fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {monthLabel}
          </h3>
          <button
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            aria-label="Mes siguiente"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/65 hover:text-white"
            style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.1)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* DOW */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW_NAMES.map((d, i) => (
            <div key={i} className="text-[10px] text-white/35 text-center tracking-[0.14em]" style={{ fontFamily: JAKARTA }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square" />;
            const iso = toISO(d);
            const session = sessionMap.get(iso);
            const isToday = iso === todayISO;
            const color = session ? srpeColor(session.srpe) : null;
            const editable = canEditDate(iso);

            return (
              <button
                key={i}
                onClick={() => handleDayClick(d)}
                disabled={!editable && !session}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-colors ${
                  editable || session ? 'hover:bg-white/[0.05]' : 'opacity-30 cursor-not-allowed'
                }`}
                style={{
                  background: isToday ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                  border: isToday ? '1px solid hsla(0,0%,100%,0.22)' : '1px solid transparent',
                }}
              >
                <span
                  className="text-[12px] tabular-nums"
                  style={{ fontFamily: JAKARTA, color: isToday ? 'white' : 'hsla(0,0%,100%,0.7)', fontWeight: isToday ? 600 : 400 }}
                >
                  {d.getDate()}
                </span>
                {session && (
                  <span
                    className="mt-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: color!, boxShadow: `0 0 6px ${color!}aa` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-[11px] text-red-300 mt-3 text-center" style={{ fontFamily: JAKARTA }}>{error}</p>
        )}

        {/* Quick add today */}
        {!loading && (
          <button
            onClick={() => { setSelectedDate(todayISO); setModalOpen(true); }}
            className="w-full mt-4 py-2.5 rounded-full flex items-center justify-center gap-2 text-[11px] tracking-[0.16em] text-white/75 uppercase"
            style={{
              fontFamily: JAKARTA,
              fontWeight: 600,
              background: 'hsla(0,0%,100%,0.05)',
              border: '1px solid hsla(0,0%,100%,0.12)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Cargar sesión de hoy
          </button>
        )}
      </div>

      <SessionModal
        open={modalOpen}
        date={selectedDate ?? todayISO}
        existing={existing}
        canEdit={canEditSelected}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
