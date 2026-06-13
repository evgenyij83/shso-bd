'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function getStatute() {
  try {
    const res = await sql`SELECT value FROM "SystemSettings" WHERE key = 'STATUTE'`
    if (res.length > 0) return res[0].value
    return 'Устав еще не добавлен.'
  } catch (e) {
    console.error(e)
    return 'Устав еще не добавлен.'
  }
}

export async function updateStatute(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return { error: 'Недостаточно прав' }

  const statute = formData.get('statute') as string

  try {
    const existing = await sql`SELECT key FROM "SystemSettings" WHERE key = 'STATUTE'`
    if (existing.length > 0) {
      await sql`UPDATE "SystemSettings" SET value = ${statute} WHERE key = 'STATUTE'`
    } else {
      await sql`INSERT INTO "SystemSettings" (key, value) VALUES ('STATUTE', ${statute})`
    }
    revalidatePath('/dashboard/admin')
    revalidatePath('/apply')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при сохранении устава' }
  }
}
