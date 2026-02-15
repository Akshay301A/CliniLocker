import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
] as const;

type LanguageContextType = {
  language: string;
  setLanguage: (code: string) => void;
  /** Translate text to current language. Returns English until translation loads, then re-renders. */
  t: (text: string) => string;
  loading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CACHE_KEY = (lang: string, text: string) => `${lang}:${text}`;

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("en");
  const [cache, setCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const pending = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    getProfile().then((p) => {
      if (mounted && p?.preferred_language) {
        setLanguageState(p.preferred_language);
      }
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
  }, []);

  const t = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return text;
      if (language === "en") return text;
      const key = CACHE_KEY(language, trimmed);
      if (cache[key]) return cache[key];
      if (!pending.current.has(key)) {
        pending.current.add(key);
        supabase.functions
          .invoke("translate", { body: { text: trimmed, target: language } })
          .then(({ data, error }) => {
            pending.current.delete(key);
            if (!error && data?.translated != null) {
              setCache((c) => ({ ...c, [key]: data.translated }));
            }
          })
          .catch(() => {
            pending.current.delete(key);
          });
      }
      return text;
    },
    [language, cache]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) {
    return {
      language: "en",
      setLanguage: () => {},
      t: (text: string) => text,
      loading: false,
    };
  }
  return ctx;
}
