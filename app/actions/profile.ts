'use server'

import sql from '@/lib/db'
import { getSession } from './auth'

export async function updateVkLink(vkLink: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  if (!['DEVELOPER', 'UNIVERSITY_ADMIN'].includes(session.role)) {
    return { error: 'Недостаточно прав' }
  }

  try {
    await sql`UPDATE "User" SET "vkLink" = ${vkLink || null} WHERE id = ${session.userId}`
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при обновлении ВК-ссылки' }
  }
}
