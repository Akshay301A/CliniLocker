import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ensureProfileExists } from "@/lib/api";

type Role = "lab" | "patient" | "doctor" | null;

const ROLE_FETCH_TIMEOUT_MS = 8000;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: Role;
  labId: string | null;
  profileReady: boolean;
  isVerified: boolean;
  doctorOnboardingComplete: boolean;
  /** True until we know session (and user if any). App shell and routing use this. */
  loading: boolean;
  /** True only when we have a user but haven't finished checking lab_users yet. Only lab routes wait on this. */
  roleLoading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [labId, setLabId] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [doctorOnboardingComplete, setDoctorOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  async function fetchRole(userId: string): Promise<{
    role: Role;
    labId: string | null;
    profileReady: boolean;
    isVerified: boolean;
    doctorOnboardingComplete: boolean;
  }> {
    const timeoutPromise = new Promise<{
      role: Role;
      labId: string | null;
      profileReady: boolean;
      isVerified: boolean;
      doctorOnboardingComplete: boolean;
    }>((resolve) =>
      setTimeout(() => resolve({
        role: null,
        labId: null,
        profileReady: false,
        isVerified: false,
        doctorOnboardingComplete: false,
      }), ROLE_FETCH_TIMEOUT_MS)
    );
    const fetchPromise = (async () => {
      try {
        const { data: labUsers } = await supabase
          .from("lab_users")
          .select("lab_id")
          .eq("user_id", userId)
          .limit(1);
        if (labUsers && labUsers.length > 0) {
          return {
            role: "lab" as Role,
            labId: labUsers[0].lab_id,
            profileReady: true,
            isVerified: true,
            doctorOnboardingComplete: true,
          };
        }
        await ensureProfileExists();
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_verified, registration_number, medical_council, full_name")
          .eq("id", userId)
          .maybeSingle();
        const onboardingComplete =
          !!profile?.full_name?.trim() &&
          !!profile?.registration_number?.trim() &&
          !!profile?.medical_council?.trim();
        return {
          role: (profile?.role as Role) ?? null,
          labId: null,
          profileReady: !!profile,
          isVerified: !!profile?.is_verified,
          doctorOnboardingComplete: onboardingComplete,
        };
      } catch {
        return {
          role: null,
          labId: null,
          profileReady: false,
          isVerified: false,
          doctorOnboardingComplete: false,
        };
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
        fetchRole(currentSession.user.id).then(({ role: r, labId: lid, profileReady: ready, isVerified: verified, doctorOnboardingComplete: onboardingComplete }) => {
          if (mounted) {
            setRole(r);
            setLabId(lid);
            setProfileReady(ready);
            setIsVerified(verified);
            setDoctorOnboardingComplete(onboardingComplete);
            setRoleLoading(false);
          }
        });
      } else {
        setRole(null);
        setLabId(null);
        setProfileReady(false);
        setIsVerified(false);
        setDoctorOnboardingComplete(false);
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
        fetchRole(newSession.user.id).then(({ role: r, labId: lid, profileReady: ready, isVerified: verified, doctorOnboardingComplete: onboardingComplete }) => {
          if (mounted) {
            setRole(r);
            setLabId(lid);
            setProfileReady(ready);
            setIsVerified(verified);
            setDoctorOnboardingComplete(onboardingComplete);
            setRoleLoading(false);
          }
        });
      } else {
        setRole(null);
        setLabId(null);
        setProfileReady(false);
        setIsVerified(false);
        setDoctorOnboardingComplete(false);
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

  async function refreshRole() {
    if (!user) return;
    setRoleLoading(true);
    const { role: r, labId: lid, profileReady: ready, isVerified: verified, doctorOnboardingComplete: onboardingComplete } = await fetchRole(user.id);
    setRole(r);
    setLabId(lid);
    setProfileReady(ready);
    setIsVerified(verified);
    setDoctorOnboardingComplete(onboardingComplete);
    setRoleLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setLabId(null);
    setProfileReady(false);
    setIsVerified(false);
    setDoctorOnboardingComplete(false);
  }

  return (
    <AuthContext.Provider value={{ user, session, role, labId, profileReady, isVerified, doctorOnboardingComplete, loading, roleLoading, refreshRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
