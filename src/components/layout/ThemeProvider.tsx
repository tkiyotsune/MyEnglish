"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store/AppProvider";

export const THEME_KEY = "myenglish:theme";

export function ThemeSync() {
  const { data, ready } = useApp();
  const theme = data.settings.theme;
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme, ready]);
  return null;
}

/** Inline script to avoid a flash of the wrong theme before hydration. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
