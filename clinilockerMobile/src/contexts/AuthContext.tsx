import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { NATIVE_REDIRECT_SCHEME } from "@/lib/supabase";
import { registerPushAndSaveToken } from "@/lib/pushRegistration";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { getProfile } from "@/lib/api";
import { cancelAllNotifications, cancelHealthTipNotification, ensureNotificationChannel, scheduleHealthTipNotification } from "@/lib/notifications";

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
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      if (!url?.startsWith(`${NATIVE_REDIRECT_SCHEME}://auth/callback`)) return;
      localStorage.setItem("oauth_callback_in_progress", "1");
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
        // Ensure session is actually available before marking callback complete.
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          const { data: { session: s } } = await supabase.auth.getSession();
          if (s?.user) break;
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } catch (e) {
        console.warn("OAuth callback handling failed:", e);
      } finally {
        // Avoid forcing browser close; Android custom tabs and some OEMs can behave inconsistently.
        if (Capacitor.getPlatform() === "ios") {
          try { await Browser.close(); } catch { /* ignore */ }
        }
        localStorage.setItem("oauth_callback_done", "1");
      }
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

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
      if (localStorage.getItem("oauth_callback_in_progress") === "1") {
        return;
      }
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
            // Navigate only after auth state and role are stable.
            if (localStorage.getItem("oauth_callback_done") === "1") {
              localStorage.removeItem("oauth_callback_done");
              localStorage.removeItem("oauth_callback_in_progress");
            }
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

  // Register FCM/APNs token when patient is logged in (native only; no-op on web).
  useEffect(() => {
    if (user && role !== "lab") {
      registerPushAndSaveToken();
      getProfile().then((profile) => {
        if (profile?.notify_sms === false) {
          cancelAllNotifications();
          return;
        }
        ensureNotificationChannel().then(() => {
          if (profile?.notify_health_tips ?? true) {
            scheduleHealthTipNotification(profile?.preferred_language ?? "en");
          } else {
            cancelHealthTipNotification();
          }
        });
      });
    }
  }, [user?.id, role]);

  // Once a user signs in at least once, skip onboarding on future launches.
  useEffect(() => {
    if (user) {
      localStorage.setItem("clinilocker_onboarding_seen", "1");
    }
  }, [user?.id]);

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
