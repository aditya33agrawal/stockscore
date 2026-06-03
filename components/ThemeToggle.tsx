"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "ss_theme";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
  root.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null) as "light" | "dark" | null;
    const initial: "light" | "dark" =
      stored ??
      (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  if (!mounted) {
    return <span className="h-8 w-8" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 text-chalk-300 hover:text-accent hover:border-accent/30 transition-colors"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
