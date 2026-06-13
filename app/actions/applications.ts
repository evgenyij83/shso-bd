'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'
import { sendVkMessage } from '@/lib/vkBot'

const roleLabels: Record<string, string> = {
  'DEVELOPER': 'разработчик',
  'UNIVERSITY_ADMIN': 'руководитель с университета',
  'HQ_COMMANDER': 'командир штаба',
  'HQ_COMMISSAR': 'комиссар штаба',
  'SQUAD_COMMANDER': 'командир отряда',
  'SQUAD_COMMISSAR': 'комиссар отряда'
}

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

    const squadInfo = await sql`SELECT name, "chatLink" FROM "Squad" WHERE id = ${squadId}`
    const squadName = squadInfo[0]?.name || 'отряд'
    const chatLink = squadInfo[0]?.chatLink

    const roleName = roleLabels[session.role] || 'администратор'
    const actorName = session.fullName || 'Имя не указано'
    const actorString = `\n\nДействие совершил(а): ${roleName} "${actorName}"`
    
    let chatMessage = ''
    if (chatLink) {
      chatMessage = `\n\nПрисоединяйся к рабочему чату отряда ${squadName} - ${chatLink}`
    } else {
      chatMessage = `\n\nСсылка на рабочий чат отряда скоро появится.`
    }

    await sendVkMessage(app.vkLink, `Ваша заявка на вступление в ${squadName} одобрена.${chatMessage}${actorString}`)

    revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true, warning: positionToAssign === 'Кандидат' ? `Лимит бойцов исчерпан. Кандидат был добавлен со статусом "Кандидат".` : undefined }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при принятии заявки' }
  }
}

export async function rejectApplication(applicationId: string, squadId: string, reason: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }
  
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== squadId) {
    return { error: 'У вас нет прав на этот отряд' }
  }

  try {
    const appResult = await sql`SELECT * FROM "Application" WHERE id = ${applicationId}`
    const app = appResult[0] as any
    if (!app) return { error: 'Заявка не найдена' }

    const squadInfo = await sql`SELECT name FROM "Squad" WHERE id = ${squadId}`
    const squadName = squadInfo[0]?.name || 'отряд'

    const roleName = roleLabels[session.role] || 'администратор'
    const actorName = session.fullName || 'Имя не указано'
    const actorString = `\n\nДействие совершил(а): ${roleName} "${actorName}"`

    await sql`DELETE FROM "Application" WHERE id = ${applicationId}`

    await sendVkMessage(app.vkLink, `Ваша заявка на вступление в ${squadName} отклонена.\nПричина: ${reason}${actorString}`)

    revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка при отклонении заявки' }
  }
}
