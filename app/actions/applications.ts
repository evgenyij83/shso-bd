'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function acceptApplication(applicationId: string, squadId: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }
  
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== squadId) {
    return { error: 'У вас нет прав на этот отряд' }
  }

  try {
    // Получаем заявку и отряд
    const appResult = await sql`SELECT * FROM "Application" WHERE id = ${applicationId}`
    const app = appResult[0] as any
    if (!app) return { error: 'Заявка не найдена' }

    const squadResult = await sql`SELECT "fighterLimit" FROM "Squad" WHERE id = ${squadId}`
    const fighterLimit = squadResult[0]?.fighterLimit

    let positionToAssign = 'Боец'

    if (fighterLimit !== null) {
      const activeFightersCountResult = await sql`SELECT COUNT(*) as count FROM "Fighter" WHERE "squadId" = ${squadId} AND position != 'Кандидат'`
      const activeFightersCount = parseInt(activeFightersCountResult[0].count, 10)
      if (activeFightersCount >= fighterLimit) {
        positionToAssign = 'Кандидат'
      }
    }

    // Переносим в бойцы
    await sql`
      INSERT INTO "Fighter" (id, "squadId", "fullName", position, faculty, "studyGroup", course, "educationForm", phone, "vkLink") 
      VALUES (gen_random_uuid(), ${app.squadId}, ${app.fullName}, ${positionToAssign}, ${app.faculty}, ${app.studyGroup}, ${app.course}, ${app.educationForm}, ${app.phone}, ${app.vkLink})
    `

    // Удаляем заявку
    await sql`DELETE FROM "Application" WHERE id = ${applicationId}`

    revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при принятии заявки' }
  }
}

export async function rejectApplication(applicationId: string, squadId: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }
  
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== squadId) {
    return { error: 'У вас нет прав на этот отряд' }
  }

  try {
    await sql`DELETE FROM "Application" WHERE id = ${applicationId}`
    revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка при отклонении заявки' }
  }
}
