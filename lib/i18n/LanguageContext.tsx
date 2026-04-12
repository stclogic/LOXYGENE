"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LangCode, T, translations } from "./translations";

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: T;
  fading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "KR",
  setLang: () => {},
  t: translations.KR,
  fading: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("KR");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("loxygene_lang") as LangCode | null;
    if (saved && saved in translations) setLangState(saved);
  }, []);

  const setLang = (l: LangCode) => {
    setFading(true);
    setTimeout(() => {
      setLangState(l);
      localStorage.setItem("loxygene_lang", l);
      setFading(false);
    }, 150);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], fading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
