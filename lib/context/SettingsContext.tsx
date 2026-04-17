"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SettingsContextValue {
  screenEffects: boolean;
  soundEffects: boolean;
  notifications: boolean;
  setScreenEffects: (v: boolean) => void;
  setSoundEffects: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  screenEffects: true,
  soundEffects: true,
  notifications: true,
  setScreenEffects: () => {},
  setSoundEffects: () => {},
  setNotifications: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [screenEffects, setScreenEffectsState] = useState(true);
  const [soundEffects, setSoundEffectsState] = useState(true);
  const [notifications, setNotificationsState] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem("loxygene-screen-effects");
      const sf = localStorage.getItem("loxygene-sound-effects");
      const n = localStorage.getItem("loxygene-notifications");
      if (s !== null) setScreenEffectsState(s === "true");
      if (sf !== null) setSoundEffectsState(sf === "true");
      if (n !== null) setNotificationsState(n === "true");
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  const setScreenEffects = (v: boolean) => {
    setScreenEffectsState(v);
    try { localStorage.setItem("loxygene-screen-effects", String(v)); } catch {}
  };
  const setSoundEffects = (v: boolean) => {
    setSoundEffectsState(v);
    try { localStorage.setItem("loxygene-sound-effects", String(v)); } catch {}
  };
  const setNotifications = (v: boolean) => {
    setNotificationsState(v);
    try { localStorage.setItem("loxygene-notifications", String(v)); } catch {}
  };

  return (
    <SettingsContext.Provider value={{ screenEffects, soundEffects, notifications, setScreenEffects, setSoundEffects, setNotifications }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
