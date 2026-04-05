'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type TranslationContextType = {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string, fallback?: string) => string
}

const TranslationContext = createContext<TranslationContextType | null>(null)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('en')
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('locale')
    if (saved) {
      setLocaleState(saved)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/translations/${locale}`)
      .then(res => res.json())
      .then(data => {
        setTranslations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [locale])

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const t = (key: string, fallback?: string): string => {
    if (loading) return fallback || key
    return translations[key] || fallback || key
  }

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    return { locale: 'en', setLocale: () => {}, t: (k: string, f?: string) => f || k }
  }
  return context
}