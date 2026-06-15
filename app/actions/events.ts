'use server'

import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'
import { sendVkMessage } from '@/lib/vkBot'

export async function createEvent(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }
  
  if (session.role !== 'UNIVERSITY_ADMIN' && session.role !== 'HQ_COMMANDER' && session.role !== 'DEVELOPER') {
    return { error: 'Нет прав на создание мероприятия' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const requirements = formData.get('requirements') as string
  const chatLink = formData.get('chatLink') as string

  try {
    const res = await sql`
      INSERT INTO "Event" (id, title, description, requirements, "chatLink", "createdById", "createdAt")
      VALUES (${Math.random().toString(36).substring(2, 15)}, ${title}, ${description}, ${requirements}, ${chatLink || null}, ${session.id}, NOW())
      RETURNING *
    `

    // Уведомление всем
    const users = await sql`SELECT "vkLink" FROM "User" WHERE "vkLink" IS NOT NULL`
    
    let senderName = session.fullName || 'Руководитель'
    if (session.role === 'DEVELOPER') {
      senderName = 'KiritoNagibator'
    }

    const msg = `${senderName} создал(а) мероприятие: ${title}.\n\nПодробности в системе.`
    
    for (const u of users as any[]) {
      await sendVkMessage(u.vkLink, msg)
    }

    revalidatePath('/dashboard/events')
    return { success: true, event: res[0] }
  } catch (e: any) {
    console.error(e)
    return { error: 'Ошибка при создании мероприятия' }
  }
}

export async function submitFightersToEvent(eventId: string, fighterIds: string[]) {
  const session = await getSession()
  if (!session || !session.squadId) return { error: 'Не авторизован или нет отряда' }
  
  if (session.role !== 'SQUAD_COMMANDER' && session.role !== 'SQUAD_COMMISSAR') {
    return { error: 'Только командиры и комиссары отряда могут подавать бойцов' }
  }

  try {
    // Проверка, что отряд еще не подавал бойцов
    const existingSubmission = await sql`SELECT id FROM "EventSubmission" WHERE "eventId" = ${eventId} AND "squadId" = ${session.squadId}`
    if (existingSubmission.length > 0) {
      return { error: 'Ваш отряд уже подал заявку на это мероприятие' }
    }

    const eventRes = await sql`SELECT title, "chatLink" FROM "Event" WHERE id = ${eventId}`
    if (eventRes.length === 0) return { error: 'Мероприятие не найдено' }
    const event = eventRes[0] as any

    // Создаем запись EventSubmission
    await sql`INSERT INTO "EventSubmission" (id, "eventId", "squadId", "createdAt") VALUES (${Math.random().toString(36).substring(2, 15)}, ${eventId}, ${session.squadId}, NOW())`

    // Добавляем бойцов в EventParticipant
    for (const fighterId of fighterIds) {
      await sql`
        INSERT INTO "EventParticipant" (id, "eventId", "fighterId", "squadId", "createdAt")
        VALUES (${Math.random().toString(36).substring(2, 15)}, ${eventId}, ${fighterId}, ${session.squadId}, NOW())
      `

      // Отправляем уведомление бойцу
      const fighterRes = await sql`SELECT "vkLink" FROM "Fighter" WHERE id = ${fighterId}`
      if (fighterRes.length > 0) {
        const fighter = fighterRes[0] as any
        if (fighter.vkLink) {
          let msg = `Вы поданы на мероприятие ${event.title}.`
          if (event.chatLink) {
            msg += `\nСсылка на общий чат: ${event.chatLink}`
          }
          await sendVkMessage(fighter.vkLink, msg)
        }
      }
    }

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { error: 'Ошибка при подаче заявки' }
  }
}
