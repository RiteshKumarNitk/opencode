'use client'

import { useTranslation } from './TranslationProvider'

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      className="bg-transparent border border-gray-600 rounded px-2 py-1 text-sm text-white"
    >
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
    </select>
  )
}