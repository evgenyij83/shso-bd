'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function updateVkLink(vkLink: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }



  try {
    await sql`UPDATE "User" SET "vkLink" = ${vkLink || null} WHERE id = ${session.userId}`
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при обновлении ВК-ссылки' }
  }
}
