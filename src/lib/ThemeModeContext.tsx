import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type ThemeMode } from './theme';

const STORAGE_KEY = 'klerosboard.theme.mode';

type ThemeModeContextValue = {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage may throw in privacy mode; ignore.
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);

  // persist on change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore write failures
    }
  }, [mode]);

  // keep in sync with OS preference changes only when the user has NOT made
  // an explicit choice (i.e., nothing stored yet). We track "locked" via a
  // ref-free check: read the storage synchronously on each toggle.
  // Implementation: skip auto-sync once user toggles, which writes to storage,
  // so the next OS change has a stored value and we bail via the early return.
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      let hasStored = false;
      try {
        hasStored = Boolean(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        hasStored = true; // treat as locked to avoid clobbering on storage errors
      }
      if (!hasStored) setModeState(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggle = useCallback(() => setModeState((prev) => (prev === 'light' ? 'dark' : 'light')), []);

  const value = useMemo<ThemeModeContextValue>(() => ({ mode, toggle, setMode }), [mode, toggle, setMode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used inside <ThemeModeProvider>');
  return ctx;
}
