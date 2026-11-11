import { useCallback, useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "ce-theme";

/** Reads the saved preference; storage can be unavailable (private mode), so never throw. */
export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Applies a preference to <html data-theme>. "system" removes it so the OS setting decides (tokens.css). */
export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  const dark = pref === "dark" || (pref === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#1B2024" : "#F2B33D");
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readThemePref);
  useEffect(() => {
    applyTheme(pref);
    if (pref !== "system") return;
    // keep the browser bar colour in step when the OS switches while the app is open
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq?.addEventListener?.("change", on);
    return () => mq?.removeEventListener?.("change", on);
  }, [pref]);
  const set = useCallback((next: ThemePref) => {
    setPref(next);
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* preference just won't persist */
    }
  }, []);
  return [pref, set] as const;
}
