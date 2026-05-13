import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { supabase, resolveUserContext, Athlete } from "@/lib/supabase";

// Legacy alias kept for components that still destructure AthleteEntry
export interface AthleteEntry {
  id: string;
  email: string;
  name: string;
  // Legacy shape kept for backward compat (unused, populated empty)
  sheetId: string;
  scriptUrl: string;
}

export interface User {
  email: string;
  name: string;
  picture: string;
  isAdmin: boolean;
  isCoach: boolean;
  coachId: string | null;
  athleteId: string | null;
  athleteName: string | null;
  athletes: AthleteEntry[];
}

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  refresh: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  refresh: async () => {},
  authError: null,
  clearAuthError: () => {},
});

function toEntry(a: Athlete): AthleteEntry {
  return {
    id: a.id,
    email: a.email,
    name: a.name ?? a.email.split("@")[0],
    sheetId: "",
    scriptUrl: "",
  };
}

async function buildUserFromSession(): Promise<{ user: User | null; error: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return { user: null, error: null };

  const email = session.user.email;
  const meta = session.user.user_metadata ?? {};
  const ctx = await resolveUserContext(email);

  // Gatekeeping: only registered coaches or athletes can access the app.
  if (!ctx.coach && !ctx.athlete) {
    await supabase.auth.signOut();
    return {
      user: null,
      error: `La cuenta ${email} no está autorizada. Contacta al coach para que te registre.`,
    };
  }

  const user: User = {
    email,
    name: meta.full_name ?? meta.name ?? ctx.coach?.name ?? ctx.athlete?.name ?? email.split("@")[0],
    picture: meta.avatar_url ?? meta.picture ?? "",
    isAdmin: ctx.isAdmin,
    isCoach: !!ctx.coach,
    coachId: ctx.coach?.id ?? null,
    athleteId: ctx.athlete?.id ?? null,
    athleteName: ctx.athlete?.name ?? null,
    athletes: ctx.athletes.map(toEntry),
  };
  return { user, error: null };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (!u) {
      supabase.auth.signOut().catch(() => { /* ignore */ });
    }
  };

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const refresh = useCallback(async () => {
    const { user: u, error } = await buildUserFromSession();
    setUserState(u);
    if (error) setAuthError(error);
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  return (
    <UserContext.Provider value={{ user, setUser, refresh, authError, clearAuthError }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
