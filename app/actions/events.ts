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
  const maxParticipantsStr = formData.get('maxParticipants') as string
  const maxParticipants = maxParticipantsStr ? parseInt(maxParticipantsStr, 10) : null

  try {
    const res = await sql`
      INSERT INTO "Event" (id, title, description, requirements, "chatLink", "maxParticipants", "createdById", "createdAt")
      VALUES (${Math.random().toString(36).substring(2, 15)}, ${title}, ${description}, ${requirements}, ${chatLink || null}, ${maxParticipants}, ${session.userId}, NOW())
      RETURNING *
    `

    // Уведомление всем уникальным пользователям
    const users = await sql`SELECT DISTINCT "vkLink" FROM "User" WHERE "vkLink" IS NOT NULL`
    
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
    const eventData = await sql.begin(async (tx) => {
      // Блокируем мероприятие для обновления, чтобы проверить лимиты
      const eventRes = await tx`SELECT title, "chatLink", "maxParticipants", status FROM "Event" WHERE id = ${eventId} FOR UPDATE`
      if (eventRes.length === 0) throw new Error('Мероприятие не найдено')
      const event = eventRes[0] as any

      if (event.status !== 'OPEN') {
        throw new Error('Прием заявок на это мероприятие уже закрыт')
      }

      // Проверяем, не добавлены ли уже эти бойцы
      const existingFightersRes = await tx`SELECT "fighterId" FROM "EventParticipant" WHERE "eventId" = ${eventId} AND "squadId" = ${session.squadId}`
      const existingFighters = new Set((existingFightersRes as any[]).map(r => r.fighterId))
      
      const newFighterIds = fighterIds.filter(id => !existingFighters.has(id))
      if (newFighterIds.length === 0) {
        return event // Все уже добавлены, ничего не делаем
      }

      // Считаем сколько уже занято
      if (event.maxParticipants !== null) {
        const countRes = await tx`SELECT COUNT(*) as c FROM "EventParticipant" WHERE "eventId" = ${eventId}`
        const currentCount = parseInt(countRes[0].c, 10)
        
        if (currentCount + newFighterIds.length > event.maxParticipants) {
          throw new Error(`Превышен лимит участников. Свободных мест: ${event.maxParticipants - currentCount}`)
        }
      }

      // Убираем создание EventSubmission, так как теперь можно дозаявлять сколько угодно
      // Добавляем новых бойцов в EventParticipant
      for (const fighterId of newFighterIds) {
        await tx`
          INSERT INTO "EventParticipant" (id, "eventId", "fighterId", "squadId", "createdAt")
          VALUES (${Math.random().toString(36).substring(2, 15)}, ${eventId}, ${fighterId}, ${session.squadId}, NOW())
        `
      }
      return event
    })

    // Уведомления ВК теперь не отправляем при подаче — они отправляются только при утверждении
    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { error: e.message || 'Ошибка при подаче заявки' }
  }
}

export async function deleteEvent(eventId: string) {
  const session = await getSession()
  if (!session || (session.role !== 'UNIVERSITY_ADMIN' && session.role !== 'HQ_COMMANDER' && session.role !== 'DEVELOPER')) {
    return { error: 'Нет прав на удаление мероприятия' }
  }

  try {
    // Удаляем связанные данные (каскадное удаление можно настроить в Prisma, но сделаем вручную для надежности)
    await sql`DELETE FROM "EventParticipant" WHERE "eventId" = ${eventId}`
    await sql`DELETE FROM "EventSubmission" WHERE "eventId" = ${eventId}`
    await sql`DELETE FROM "Event" WHERE id = ${eventId}`

    revalidatePath('/dashboard/events')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при удалении мероприятия' }
  }
}

export async function removeFighterFromEvent(eventId: string, participantId: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }

  try {
    const eventRes = await sql`SELECT "createdById", status FROM "Event" WHERE id = ${eventId}`
    if (eventRes.length === 0) return { error: 'Мероприятие не найдено' }
    
    if (eventRes[0].status !== 'OPEN') {
      return { error: 'Мероприятие уже закрыто' }
    }

    if (session.role !== 'DEVELOPER' && eventRes[0].createdById !== session.userId) {
      return { error: 'Только создатель мероприятия и разработчик могут удалять участников' }
    }

    await sql`DELETE FROM "EventParticipant" WHERE id = ${participantId} AND "eventId" = ${eventId}`
    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при удалении бойца' }
  }
}

export async function approveEvent(eventId: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }

  try {
    const eventRes = await sql`SELECT title, "chatLink", "createdById", status FROM "Event" WHERE id = ${eventId}`
    if (eventRes.length === 0) return { error: 'Мероприятие не найдено' }
    const event = eventRes[0] as any

    if (event.status !== 'OPEN') {
      return { error: 'Списки уже утверждены' }
    }

    if (session.role !== 'DEVELOPER' && event.createdById !== session.userId) {
      return { error: 'Только создатель мероприятия и разработчик могут утвердить список' }
    }

    // Меняем статус
    await sql`UPDATE "Event" SET status = 'APPROVED' WHERE id = ${eventId}`

    // Получаем всех текущих участников
    const participants = await sql`
      SELECT f."vkLink" 
      FROM "EventParticipant" ep
      JOIN "Fighter" f ON ep."fighterId" = f.id
      WHERE ep."eventId" = ${eventId}
    `

    let senderName = session.fullName || 'Руководитель'
    if (session.role === 'DEVELOPER') {
      senderName = 'KiritoNagibator'
    }

    let msg = `${senderName} утвердил(а) вас в список участников на мероприятие "${event.title}".`
    if (event.chatLink) {
      msg += `\nСсылка на общий чат: ${event.chatLink}`
    }

    // Рассылаем
    for (const p of participants as any[]) {
      if (p.vkLink) {
        await sendVkMessage(p.vkLink, msg)
      }
    }

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при утверждении списка' }
  }
}
