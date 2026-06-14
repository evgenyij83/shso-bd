'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'
import { sendVkMessage } from '@/lib/vkBot'

const roleLabels: Record<string, string> = {
  'UNIVERSITY_ADMIN': 'Руководство Университета',
  'HQ_COMMANDER': 'Командир Штаба',
  'HQ_COMMISSAR': 'Комиссар Штаба',
  'SQUAD_COMMANDER': 'Командир Отряда',
  'SQUAD_COMMISSAR': 'Комиссар Отряда',
  'DEVELOPER': 'Разработчик'
}

export async function submitAccountRequest(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Недостаточно прав' }
  const isHQRole = session.role === 'HQ_COMMANDER' || session.role === 'HQ_COMMISSAR'
  if (session.role !== 'UNIVERSITY_ADMIN' && !isHQRole) return { error: 'Недостаточно прав' }

  // Проверяем что у руководителя указана ВК-ссылка
  const currentUser = await sql`SELECT "vkLink" FROM "User" WHERE id = ${session.userId}`
  if (!currentUser[0]?.vkLink) {
    return { error: 'Для отправки заявок необходимо сначала указать ссылку на ваш профиль ВКонтакте в настройках.' }
  }

  const requestedRole = formData.get('role') as string
  const squadId = formData.get('squadId') as string | null
  const fullName = formData.get('fullName') as string
  const faculty = formData.get('faculty') as string | null
  const studyGroup = formData.get('studyGroup') as string | null
  const courseStr = formData.get('course') as string | null
  const course = courseStr ? parseInt(courseStr, 10) : null
  const educationForm = formData.get('educationForm') as string | null
  const phone = formData.get('phone') as string | null
  const vkLink = formData.get('vkLink') as string | null

  if (!requestedRole || !fullName) return { error: 'Заполните обязательные поля' }

  const isSquadRole = ['SQUAD_COMMANDER', 'SQUAD_COMMISSAR'].includes(requestedRole)
  if (isSquadRole && !squadId) return { error: 'Для этой роли необходимо выбрать отряд' }

  // Проверки на уникальность ролей
  if (isSquadRole && squadId) {
    const position = requestedRole === 'SQUAD_COMMANDER' ? 'Командир' : 'Комиссар'
    const existingUser = await sql`SELECT id FROM "User" WHERE role = ${requestedRole} AND "squadId" = ${squadId}`
    if (existingUser.length > 0) return { error: `В этом отряде уже есть аккаунт ${position.toLowerCase()}а` }
  }

  const isHQ = ['HQ_COMMANDER', 'HQ_COMMISSAR'].includes(requestedRole)
  if (isHQ) {
    const existingHQ = await sql`SELECT id FROM "User" WHERE role = ${requestedRole}`
    if (existingHQ.length > 0) {
      const position = requestedRole === 'HQ_COMMANDER' ? 'командира' : 'комиссара'
      return { error: `Аккаунт ${position} штаба уже существует.` }
    }
  }

  // Обязательная ВК-ссылка для командиров/комиссаров
  if ((isSquadRole || isHQ) && !vkLink) {
    return { error: 'Для этой роли обязательно указать ссылку на ВК' }
  }

  try {
    await sql`
      INSERT INTO "AccountRequest" (id, "requestedRole", "squadId", "fullName", faculty, "studyGroup", course, "educationForm", phone, "vkLink", "requestedByUserId", "createdAt")
      VALUES (gen_random_uuid(), ${requestedRole}, ${squadId || null}, ${fullName}, ${faculty || null}, ${studyGroup || null}, ${course}, ${educationForm || null}, ${phone || null}, ${vkLink || null}, ${session.userId}, NOW())
    `

    // Уведомить разработчика в ВК
    const developers = await sql`SELECT "vkLink" FROM "User" WHERE role = 'DEVELOPER'`
    for (const dev of developers) {
      if (dev.vkLink) {
        await sendVkMessage(dev.vkLink, `${session.fullName || 'Руководитель'} оставил(а) заявку на создание нового пользователя.`)
      }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при отправке заявки' }
  }
}

export async function getAccountRequests() {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return []

  try {
    const requests = await sql`
      SELECT ar.*, s.name as "squadName", u."fullName" as "requesterName"
      FROM "AccountRequest" ar
      LEFT JOIN "Squad" s ON ar."squadId" = s.id
      LEFT JOIN "User" u ON ar."requestedByUserId" = u.id
      ORDER BY ar."createdAt" ASC
    `
    return requests as any[]
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function acceptAccountRequest(requestId: string, uniqueCode: string) {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return { error: 'Недостаточно прав' }

  if (!uniqueCode || !uniqueCode.trim()) return { error: 'Укажите уникальный код (идентификатор)' }

  try {
    const reqResult = await sql`SELECT * FROM "AccountRequest" WHERE id = ${requestId}`
    const req = reqResult[0] as any
    if (!req) return { error: 'Заявка не найдена' }

    // Проверяем что код не занят
    const existingCode = await sql`SELECT id FROM "User" WHERE "uniqueCode" = ${uniqueCode.trim()}`
    if (existingCode.length > 0) return { error: 'Этот уникальный код уже используется' }

    const role = req.requestedRole
    const squadId = req.squadId || null
    
    // Проверки на уникальность ролей при создании аккаунта
    const isSquadRole = ['SQUAD_COMMANDER', 'SQUAD_COMMISSAR'].includes(role)
    const isHQ = ['HQ_COMMANDER', 'HQ_COMMISSAR'].includes(role)

    if (isSquadRole && squadId) {
      const position = role === 'SQUAD_COMMANDER' ? 'Командир' : 'Комиссар'
      const existingUser = await sql`SELECT id FROM "User" WHERE role = ${role} AND "squadId" = ${squadId}`
      if (existingUser.length > 0) return { error: `В этом отряде уже есть аккаунт ${position.toLowerCase()}а` }
      
      const existingFighter = await sql`SELECT id FROM "Fighter" WHERE position = ${position} AND "squadId" = ${squadId}`
      if (existingFighter.length > 0) return { error: `В этом отряде уже есть ${position.toLowerCase()} в списке бойцов` }
    }

    if (isHQ) {
      const existingHQ = await sql`SELECT id FROM "User" WHERE role = ${role}`
      if (existingHQ.length > 0) {
        const position = role === 'HQ_COMMANDER' ? 'командира' : 'комиссара'
        return { error: `Аккаунт ${position} штаба уже существует. Удалите старый аккаунт перед принятием заявки.` }
      }
    }

    // Создаём пользователя
    await sql`
      INSERT INTO "User" (id, "uniqueCode", role, "squadId", "fullName", "vkLink")
      VALUES (gen_random_uuid(), ${uniqueCode.trim()}, ${role}, ${squadId}, ${req.fullName}, ${req.vkLink || null})
    `

    // Авто-создание Fighter для командиров/комиссаров

    if ((isSquadRole || isHQ) && squadId && req.fullName) {
      let position = 'Боец'
      if (role === 'SQUAD_COMMANDER') position = 'Командир'
      if (role === 'SQUAD_COMMISSAR') position = 'Комиссар'
      if (role === 'HQ_COMMANDER') position = 'Командир штаба'
      if (role === 'HQ_COMMISSAR') position = 'Комиссар штаба'

      await sql`
        INSERT INTO "Fighter" (id, "squadId", "fullName", position, faculty, "studyGroup", course, "educationForm", phone, "vkLink")
        VALUES (gen_random_uuid(), ${squadId}, ${req.fullName}, ${position}, ${req.faculty || '—'}, ${req.studyGroup || '—'}, ${req.course || 1}, ${req.educationForm || 'Бюджет'}, ${req.phone || '—'}, ${req.vkLink || null})
      `
    }

    // Удаляем заявку
    await sql`DELETE FROM "AccountRequest" WHERE id = ${requestId}`

    revalidatePath('/dashboard/admin')
    if (squadId) revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при принятии заявки. Возможно код уже существует.' }
  }
}

export async function rejectAccountRequest(requestId: string, reason: string) {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return { error: 'Недостаточно прав' }

  if (!reason || !reason.trim()) return { error: 'Укажите причину отклонения' }

  try {
    const reqResult = await sql`SELECT ar.*, u."vkLink" as "requesterVkLink" FROM "AccountRequest" ar LEFT JOIN "User" u ON ar."requestedByUserId" = u.id WHERE ar.id = ${requestId}`
    const req = reqResult[0] as any
    if (!req) return { error: 'Заявка не найдена' }

    // Отправляем ВК-сообщение руководителю
    if (req.requesterVkLink) {
      const actorString = `\n\nДействие совершил(а): Разработчик "KiritoNagibator"`
      await sendVkMessage(req.requesterVkLink, `Заявка на создание аккаунта отклонена.\nПричина: ${reason.trim()}${actorString}`)
    }

    await sql`DELETE FROM "AccountRequest" WHERE id = ${requestId}`

    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при отклонении заявки' }
  }
}
