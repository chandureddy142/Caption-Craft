import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode, ReactElement } from "react";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export interface AuthResult {
  error: string | null;
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED: AuthResult = {
  error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.",
};

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null, needsEmailConfirmation: data.session === null };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/studio` },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, loading, signInWithPassword, signUp, signInWithGoogle, signOut }),
    [session, loading, signInWithPassword, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
