import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { loadData, saveData, today, type AppData } from './lib/storage';

interface Ctx {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    loadData().then(setData);
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      saveData(next);
      return next;
    });
  }, []);

  if (!data) return <div className="loading">Cargando…</div>;
  return <AppCtx.Provider value={{ data, update }}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

/** Counts practice time toward today's goal while this screen is open and visible. */
export function usePracticeTimer() {
  const { update } = useApp();
  const last = useRef(Date.now());
  useEffect(() => {
    last.current = Date.now();
    const flush = () => {
      const now = Date.now();
      const secs = Math.min(60, Math.round((now - last.current) / 1000));
      last.current = now;
      if (document.visibilityState !== 'visible' || secs <= 0) return;
      const d = today();
      update((data) => {
        const days = [...data.days];
        const i = days.findIndex((x) => x.date === d);
        if (i >= 0) days[i] = { ...days[i], seconds: days[i].seconds + secs };
        else days.push({ date: d, seconds: secs });
        return { ...data, days: days.slice(-120) };
      });
    };
    const t = setInterval(flush, 15_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') last.current = Date.now();
      else flush();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
      flush();
    };
  }, [update]);
}

export function minutesToday(data: AppData): number {
  return Math.floor((data.days.find((d) => d.date === today())?.seconds ?? 0) / 60);
}

export function streak(data: AppData): number {
  const active = new Set(data.days.filter((d) => d.seconds >= 60).map((d) => d.date));
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const d = new Date();
  if (!active.has(fmt(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (active.has(fmt(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
