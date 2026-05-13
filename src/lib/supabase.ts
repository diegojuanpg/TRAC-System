import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[supabase] missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  },
});

export type Coach = {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
};

export type Athlete = {
  id: string;
  email: string;
  name: string | null;
  coach_id: string | null;
};

/* ── Resolve the authenticated user to a coach or athlete row ── */
export async function resolveUserContext(email: string): Promise<{
  isAdmin: boolean;
  coach: Coach | null;
  athlete: Athlete | null;
  athletes: Athlete[];
}> {
  const { data: coach } = await supabase
    .from('coaches')
    .select('id, email, name, is_admin')
    .eq('email', email)
    .maybeSingle();

  if (coach) {
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id, email, name, coach_id')
      .order('name', { ascending: true });
    return {
      isAdmin: !!coach.is_admin,
      coach: coach as Coach,
      athlete: null,
      athletes: (athletes ?? []) as Athlete[],
    };
  }

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, email, name, coach_id')
    .eq('email', email)
    .maybeSingle();

  return {
    isAdmin: false,
    coach: null,
    athlete: (athlete ?? null) as Athlete | null,
    athletes: [],
  };
}
