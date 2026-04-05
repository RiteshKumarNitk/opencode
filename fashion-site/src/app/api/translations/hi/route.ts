import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const translations = await prisma.translation.findMany({
    where: { locale: 'hi' }
  })
  
  const obj: Record<string, string> = {}
  translations.forEach(t => {
    obj[t.key] = t.value
  })
  
  return NextResponse.json(obj)
}