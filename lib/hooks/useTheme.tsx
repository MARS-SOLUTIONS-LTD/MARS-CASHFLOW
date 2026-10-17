'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';
const KEY = 'mars.theme';

const ThemeCtx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({
  mode: 'system',
  setMode: () => {},
});

function safeGetStoredMode(): Mode | null {
  try {
    const value = localStorage.getItem(KEY);
    if (!value) return null;
    if (value === 'light' || value === 'dark' || value === 'system') return value;
    return null;
  } catch {
    return null;
  }
}

function safeSetStoredMode(mode: Mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // ignore private mode / disabled storage
  }
}

function prefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'system';
    return safeGetStoredMode() ?? 'system';
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };

    apply();

    const listener = () => apply();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    if (typeof media.addListener === 'function') {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }

    return undefined;
  }, [mode]);

  const setMode = (m: Mode) => {
    safeSetStoredMode(m);
    setModeState(m);

    try {
      const dark = m === 'dark' || (m === 'system' && prefersDark());
      document.documentElement.classList.toggle('dark', dark);
    } catch {
      // ignore
    }
  };

  return <ThemeCtx.Provider value={{ mode, setMode }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
