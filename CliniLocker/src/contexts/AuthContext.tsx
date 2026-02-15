import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Role = "lab" | "patient" | null;

const ROLE_FETCH_TIMEOUT_MS = 8000;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: Role;
  labId: string | null;
  /** True until we know session (and user if any). App shell and routing use this. */
  loading: boolean;
  /** True only when we have a user but haven't finished checking lab_users yet. Only lab routes wait on this. */
  roleLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [labId, setLabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  async function fetchRole(userId: string): Promise<{ role: Role; labId: string | null }> {
    const timeoutPromise = new Promise<{ role: Role; labId: string | null }>((resolve) =>
      setTimeout(() => resolve({ role: null, labId: null }), ROLE_FETCH_TIMEOUT_MS)
    );
    const fetchPromise = (async () => {
      try {
        const { data: labUsers } = await supabase
          .from("lab_users")
          .select("lab_id")
          .eq("user_id", userId)
          .limit(1);
        if (labUsers && labUsers.length > 0) {
          return { role: "lab" as Role, labId: labUsers[0].lab_id };
        }
        return { role: null, labId: null };
      } catch {
        return { role: null, labId: null };
      }
    })();
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  useEffect(() => {
    let mounted = true;

    function applySession(currentSession: Session | null) {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      if (currentSession?.user) {
        setRoleLoading(true);
        fetchRole(currentSession.user.id).then(({ role: r, labId: lid }) => {
          if (mounted) {
            setRole(r);
            setLabId(lid);
            setRoleLoading(false);
          }
        });
      } else {
        setRole(null);
        setLabId(null);
      }
    }

    async function onAuthChange() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;
      // If URL has OAuth hash but no session yet, Supabase may still be parsing it.
      // Don't set loading=false yet so we don't redirect to login; onAuthStateChange will fire.
      const hasOAuthHash =
        typeof window !== "undefined" &&
        /#.*(access_token|refresh_token)=/.test(window.location.hash);
      if (!currentSession && hasOAuthHash) {
        return;
      }
      applySession(currentSession);
    }

    onAuthChange();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      if (newSession && typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      if (newSession?.user) {
        setRoleLoading(true);
        fetchRole(newSession.user.id).then(({ role: r, labId: lid }) => {
          if (mounted) {
            setRole(r);
            setLabId(lid);
            setRoleLoading(false);
          }
        });
      } else {
        setRole(null);
        setLabId(null);
        setRoleLoading(false);
      }
    });

    // If we skipped setLoading(false) due to OAuth hash, give Supabase time to parse then re-check.
    const fallbackTimer = window.setTimeout(() => {
      if (!mounted) return;
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (!mounted) return;
        if (s) {
          applySession(s);
        } else {
          setLoading(false);
        }
      });
    }, 800);

    return () => {
      mounted = false;
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setLabId(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, role, labId, loading, roleLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
