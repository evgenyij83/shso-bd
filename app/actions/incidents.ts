'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { sendVkMessage } from '@/lib/vkBot'

const roleLabels: Record<string, string> = {
  'SQUAD_COMMANDER': 'Командир',
  'SQUAD_COMMISSAR': 'Комиссар',
}

export async function submitIncidentReport(squadId: string, fighterNames: string[], description: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }
  if (!['SQUAD_COMMANDER', 'SQUAD_COMMISSAR'].includes(session.role)) return { error: 'Недостаточно прав' }
  if (session.squadId !== squadId) return { error: 'Нет доступа к этому отряду' }

  if (!fighterNames || fighterNames.length === 0) return { error: 'Выберите хотя бы одного человека' }
  if (!description || !description.trim()) return { error: 'Опишите ситуацию' }

  try {
    const involvedNamesJson = JSON.stringify(fighterNames)

    await sql`
      INSERT INTO "IncidentReport" (id, "squadId", "reportedByUserId", description, "involvedNames", "createdAt")
      VALUES (gen_random_uuid(), ${squadId}, ${session.userId}, ${description.trim()}, ${involvedNamesJson}, NOW())
    `

    // Получаем название отряда
    const squadResult = await sql`SELECT name FROM "Squad" WHERE id = ${squadId}`
    const squadName = squadResult[0]?.name || 'отряд'

    const roleName = roleLabels[session.role] || 'командир'
    const involvedList = fighterNames.join(', ')

    const message = `Доклад от ${roleName.toLowerCase()}а о происшествии в отряде «${squadName}»:\n\nУчастники: ${involvedList}\n\nОписание происшествия:\n${description.trim()}`

    // Уведомляем все ключевые роли
    const keyUsers = await sql`
      SELECT "vkLink" FROM "User" 
      WHERE role IN ('HQ_COMMANDER', 'HQ_COMMISSAR', 'DEVELOPER', 'UNIVERSITY_ADMIN')
      AND "vkLink" IS NOT NULL
    `

    for (const user of keyUsers) {
      if (user.vkLink) {
        await sendVkMessage(user.vkLink, message)
      }
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при отправке доклада' }
  }
}
