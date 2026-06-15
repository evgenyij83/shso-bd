'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'
import { sendVkMessage } from '@/lib/vkBot'

export async function getSquadsForPractice() {
  try {
    const s = await sql`SELECT id, name FROM "Squad" ORDER BY name ASC`
    return s
  } catch (e) {
    return []
  }
}

export async function submitPracticeRequest(formData: FormData) {
  const practiceType = formData.get('practiceType')?.toString() || ''
  const squadId = formData.get('squadId')?.toString()
  const fullName = formData.get('fullName')?.toString() || ''
  const faculty = formData.get('faculty')?.toString() || ''
  const courseStr = formData.get('course')?.toString() || ''
  const studyGroup = formData.get('studyGroup')?.toString() || ''
  const period = formData.get('period')?.toString() || ''
  const phone = formData.get('phone')?.toString() || ''
  const vkLinkRaw = formData.get('vkLink')?.toString()

  if (!vkLinkRaw || !squadId) {
    return { error: 'Пожалуйста, заполните обязательные поля (Отряд и ВК)' }
  }

  let course = parseInt(courseStr, 10)
  if (isNaN(course) || course < 1 || course > 6) {
    course = 0
  }

  // Очистка ссылки ВК
  let vkLink = vkLinkRaw.trim()
  if (vkLink && !vkLink.startsWith('http')) {
    vkLink = `https://vk.com/${vkLink.replace('@', '')}`
  }

  try {
    const res = await sql`
      INSERT INTO "PracticeRequest" (id, "practiceType", "squadId", "fullName", faculty, course, "studyGroup", period, phone, "vkLink", status, "createdAt")
      VALUES (gen_random_uuid(), ${practiceType}, ${squadId}, ${fullName}, ${faculty}, ${course}, ${studyGroup}, ${period}, ${phone}, ${vkLink}, 'PENDING', NOW())
      RETURNING id
    `
    const squadRes = await sql`SELECT name FROM "Squad" WHERE id = ${squadId}`
    const squadName = squadRes[0]?.name || 'отряде'

    // Уведомления командиру и комиссару
    const squadAdmins = await sql`
      SELECT "vkLink" FROM "User" 
      WHERE "squadId" = ${squadId} AND role IN ('SQUAD_COMMANDER', 'SQUAD_COMMISSAR') AND "vkLink" IS NOT NULL
    `
    // Уведомления руководителям
    const uniAdmins = await sql`
      SELECT "vkLink" FROM "User" 
      WHERE role = 'UNIVERSITY_ADMIN' AND "vkLink" IS NOT NULL
    `

    const msg = `Обучающийся ${fullName} направил заявку на прохождение практики ${practiceType} в ${squadName}`
    const allLinks = [...squadAdmins, ...uniAdmins].map((u: any) => u.vkLink).filter(Boolean)

    for (const link of allLinks) {
      await sendVkMessage(link, msg)
    }

    return { success: true }
  } catch (e) {
    console.error('Submit Practice Request error:', e)
    return { error: 'Произошла ошибка при отправке заявки' }
  }
}

export async function getPendingPracticeRequestsForSquad(squadId: string) {
  const session = await getSession()
  if (!session || (session.role !== 'SQUAD_COMMANDER' && session.role !== 'SQUAD_COMMISSAR' && session.role !== 'HQ_COMMANDER')) return []

  try {
    const reqs = await sql`
      SELECT pr.*, s.name as "squadName"
      FROM "PracticeRequest" pr
      JOIN "Squad" s ON pr."squadId" = s.id
      WHERE pr."squadId" = ${squadId} AND pr.status = 'PENDING'
      ORDER BY pr."createdAt" DESC
    `
    return reqs
  } catch (e) {
    return []
  }
}

export async function getPendingPracticeRequestsForUni() {
  const session = await getSession()
  if (!session || session.role !== 'UNIVERSITY_ADMIN') return []

  try {
    const reqs = await sql`
      SELECT pr.*, s.name as "squadName"
      FROM "PracticeRequest" pr
      JOIN "Squad" s ON pr."squadId" = s.id
      WHERE pr.status = 'PENDING'
      ORDER BY pr."createdAt" DESC
    `
    return reqs
  } catch (e) {
    return []
  }
}

export async function getPendingPracticeCount(squadId?: string) {
  const session = await getSession()
  if (!session) return 0
  try {
    if (session.role === 'UNIVERSITY_ADMIN') {
      const res = await sql`SELECT COUNT(*) as c FROM "PracticeRequest" WHERE status = 'PENDING'`
      return parseInt(res[0].c, 10)
    } else if (session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') {
      const sq = squadId || session.squadId
      if (!sq) return 0
      const res = await sql`SELECT COUNT(*) as c FROM "PracticeRequest" WHERE "squadId" = ${sq} AND status = 'PENDING'`
      return parseInt(res[0].c, 10)
    }
  } catch (e) {
    return 0
  }
  return 0
}

export async function processPracticeRequest(requestId: string, isApproved: boolean, rejectReason?: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  try {
    const reqs = await sql`
      SELECT pr.*, s.name as "squadName", s."chatLink"
      FROM "PracticeRequest" pr
      JOIN "Squad" s ON pr."squadId" = s.id
      WHERE pr.id = ${requestId}
    `
    if (reqs.length === 0) return { error: 'Заявка не найдена' }
    const req = reqs[0] as any

    const newStatus = isApproved ? 'APPROVED' : 'REJECTED'
    const processorName = session.fullName || 'Руководитель'

    await sql`
      UPDATE "PracticeRequest"
      SET status = ${newStatus}, "processedBy" = ${processorName}, "rejectReason" = ${rejectReason || null}
      WHERE id = ${requestId}
    `

    if (isApproved) {
      // Добавляем бойца в отряд
      await sql`
        INSERT INTO "Fighter" (id, "squadId", position, "fullName", faculty, "studyGroup", course, "educationForm", phone, "vkLink")
        VALUES (
          gen_random_uuid(), ${req.squadId}, 'Боец', ${req.fullName || 'Не указано'}, 
          ${req.faculty || 'Не указано'}, ${req.studyGroup || 'Не указано'}, 
          ${req.course || 0}, 'Не указано', ${req.phone || 'Не указано'}, ${req.vkLink || null}
        )
      `
    }

    if (req.vkLink) {
      if (isApproved) {
        let msg = `Ваша заявка на прохождение практики ${req.practiceType} в ${req.squadName} одобрена.`
        if (req.chatLink) {
          msg += `\nСсылка на общий чат отряда: ${req.chatLink}`
        }
        await sendVkMessage(req.vkLink, msg)
      } else {
        await sendVkMessage(req.vkLink, `Ваша заявка на прохождение практики ${req.practiceType} в ${req.squadName} Отклонена. Причина: ${rejectReason || 'не указана'}. Обработал(а): ${processorName}.`)
      }
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при обработке заявки' }
  }
}
