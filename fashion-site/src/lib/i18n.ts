import { prisma } from '@/lib/prisma'

const cache: Record<string, Record<string, string>> = {}

export async function getTranslations(locale: string): Promise<Record<string, string>> {
  if (cache[locale]) {
    return cache[locale]
  }

  const translations = await prisma.translation.findMany({
    where: { locale }
  })

  const obj: Record<string, string> = {}
  translations.forEach(t => {
    obj[t.key] = t.value
  })

  cache[locale] = obj
  return obj
}

export async function t(locale: string, key: string, fallback?: string): Promise<string> {
  const translations = await getTranslations(locale)
  return translations[key] || fallback || key
}

export async function setTranslation(locale: string, key: string, value: string) {
  await prisma.translation.upsert({
    where: { locale_key: { locale, key } },
    update: { value },
    create: { locale, key, value }
  })
  delete cache[locale]
}

export async function getAllTranslations(locale: string) {
  return getTranslations(locale)
}

export function clearCache(locale?: string) {
  if (locale) {
    delete cache[locale]
  } else {
    Object.keys(cache).forEach(k => delete cache[k])
  }
}