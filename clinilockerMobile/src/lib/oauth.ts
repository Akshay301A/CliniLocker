import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase, getRedirectUrl } from "./supabase";

/**
 * Starts Google OAuth in a way that works for both web and native.
 * Native uses in-app browser + deep link callback.
 */
export async function startGoogleOAuth(nextPath: string): Promise<{ error?: string }> {
  if (Capacitor.isNativePlatform()) {
    localStorage.setItem("oauth_next_path", nextPath.startsWith("/") ? nextPath : "/patient/dashboard");
    localStorage.setItem("oauth_callback_in_progress", "1");
    localStorage.removeItem("oauth_callback_done");
  }
  const redirectTo = getRedirectUrl(nextPath);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "openid email profile",
      queryParams: {
        prompt: "select_account",
      },
      ...(Capacitor.isNativePlatform() ? { skipBrowserRedirect: true } : {}),
    },
  });
  if (error) return { error: error.message };

  if (Capacitor.isNativePlatform() && data?.url) {
    await Browser.open({ url: data.url });
  } else if (Capacitor.isNativePlatform()) {
    localStorage.removeItem("oauth_callback_in_progress");
  }
  return {};
}
