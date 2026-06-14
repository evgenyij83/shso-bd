'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'
import { sendVkMessage } from '@/lib/vkBot'

const roleLabels: Record<string, string> = {
  'HQ_COMMANDER': 'Командир Штаба',
  'HQ_COMMISSAR': 'Комиссар Штаба',
  'SQUAD_COMMANDER': 'Командир Отряда',
  'SQUAD_COMMISSAR': 'Комиссар Отряда',
  'UNIVERSITY_ADMIN': 'Руководство Университета',
  'DEVELOPER': 'Разработчик'
}

export async function submitAwardNomination(squadId: string, nominees: { fighterId: string, fighterName: string, description: string }[]) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }
  if (!['SQUAD_COMMANDER', 'SQUAD_COMMISSAR'].includes(session.role)) return { error: 'Недостаточно прав' }
  if (session.squadId !== squadId) return { error: 'Нет доступа к этому отряду' }

  if (!nominees || nominees.length === 0) return { error: 'Выберите хотя бы одного бойца' }
  for (const n of nominees) {
    if (!n.description.trim()) return { error: `Укажите заслуги для ${n.fighterName}` }
  }

  try {
    // Создаём номинацию
    const result = await sql`
      INSERT INTO "AwardNomination" (id, "squadId", "nominatedByUserId", status, "createdAt")
      VALUES (gen_random_uuid(), ${squadId}, ${session.userId}, 'PENDING_HQ', NOW())
      RETURNING id
    `
    const nominationId = result[0].id

    // Создаём номинантов
    for (const n of nominees) {
      await sql`
        INSERT INTO "AwardNominee" (id, "nominationId", "fighterName", "fighterId", description)
        VALUES (gen_random_uuid(), ${nominationId}, ${n.fighterName}, ${n.fighterId}, ${n.description.trim()})
      `
    }

    // Получаем название отряда
    const squadResult = await sql`SELECT name FROM "Squad" WHERE id = ${squadId}`
    const squadName = squadResult[0]?.name || 'отряд'

    const roleName = roleLabels[session.role] || 'командир'

    // Уведомляем командира и комиссара штаба
    const hqUsers = await sql`SELECT "vkLink" FROM "User" WHERE role IN ('HQ_COMMANDER', 'HQ_COMMISSAR')`
    for (const hq of hqUsers) {
      if (hq.vkLink) {
        await sendVkMessage(hq.vkLink, `${roleName} отряда «${squadName}» подал список для награждения на согласование.`)
      }
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при создании заявки на награждение' }
  }
}

export async function getPendingAwardNominations() {
  const session = await getSession()
  if (!session) return []

  let statusFilter: string
  if (session.role === 'HQ_COMMANDER' || session.role === 'HQ_COMMISSAR') {
    statusFilter = 'PENDING_HQ'
  } else if (session.role === 'UNIVERSITY_ADMIN') {
    statusFilter = 'PENDING_UNIVERSITY'
  } else {
    return []
  }

  try {
    const nominations = await sql`
      SELECT an.*, s.name as "squadName", u."fullName" as "nominatorName", u.role as "nominatorRole"
      FROM "AwardNomination" an
      JOIN "Squad" s ON an."squadId" = s.id
      JOIN "User" u ON an."nominatedByUserId" = u.id
      WHERE an.status = ${statusFilter}
      ${session.role === 'UNIVERSITY_ADMIN' && session.userId ? sql`AND an."targetAdminUserId" = ${session.userId}` : sql``}
      ORDER BY an."createdAt" ASC
    `

    // Для каждой номинации получаем номинантов
    for (const nom of nominations) {
      const nominees = await sql`
        SELECT * FROM "AwardNominee" WHERE "nominationId" = ${(nom as any).id}
      `
      ;(nom as any).nominees = nominees
    }

    return nominations
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function approveByHQ(nominationId: string, approvedNomineeIds: string[], targetAdminUserId: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }
  if (!['HQ_COMMANDER', 'HQ_COMMISSAR'].includes(session.role)) return { error: 'Недостаточно прав' }

  if (!approvedNomineeIds || approvedNomineeIds.length === 0) return { error: 'Выберите хотя бы одного кандидата' }
  if (!targetAdminUserId) return { error: 'Выберите руководителя для отправки' }

  try {
    // Обновляем одобренных
    await sql`UPDATE "AwardNominee" SET "approvedByHq" = true WHERE "nominationId" = ${nominationId} AND id = ANY(${approvedNomineeIds})`

    // Удаляем неодобренных
    await sql`DELETE FROM "AwardNominee" WHERE "nominationId" = ${nominationId} AND id != ALL(${approvedNomineeIds})`

    // Обновляем статус
    await sql`UPDATE "AwardNomination" SET status = 'PENDING_UNIVERSITY', "approvedByHqUserId" = ${session.userId}, "targetAdminUserId" = ${targetAdminUserId} WHERE id = ${nominationId}`

    // Получаем название отряда
    const nomResult = await sql`
      SELECT an."squadId", s.name as "squadName"
      FROM "AwardNomination" an
      JOIN "Squad" s ON an."squadId" = s.id
      WHERE an.id = ${nominationId}
    `
    const squadName = nomResult[0]?.squadName || 'отряд'

    const roleName = roleLabels[session.role] || 'Командир Штаба'

    // Уведомляем руководителя
    const admin = await sql`SELECT "vkLink" FROM "User" WHERE id = ${targetAdminUserId}`
    if (admin[0]?.vkLink) {
      await sendVkMessage(admin[0].vkLink, `${roleName} согласовал список на награждение из отряда «${squadName}». Ознакомьтесь для утверждения.`)
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при согласовании' }
  }
}

export async function approveByUniversity(nominationId: string, approvedNomineeIds: string[]) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }
  if (session.role !== 'UNIVERSITY_ADMIN') return { error: 'Недостаточно прав' }

  if (!approvedNomineeIds || approvedNomineeIds.length === 0) return { error: 'Выберите хотя бы одного кандидата' }

  try {
    await sql`UPDATE "AwardNominee" SET "approvedByUni" = true WHERE "nominationId" = ${nominationId} AND id = ANY(${approvedNomineeIds})`
    await sql`DELETE FROM "AwardNominee" WHERE "nominationId" = ${nominationId} AND id != ALL(${approvedNomineeIds})`
    await sql`UPDATE "AwardNomination" SET status = 'APPROVED' WHERE id = ${nominationId}`

    return { success: true, nominationId }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при утверждении' }
  }
}

export async function getUniversityAdmins() {
  const session = await getSession()
  if (!session) return []
  if (!['HQ_COMMANDER', 'HQ_COMMISSAR'].includes(session.role)) return []

  try {
    const admins = await sql`SELECT id, "fullName" FROM "User" WHERE role = 'UNIVERSITY_ADMIN'`
    return admins
  } catch (e) {
    return []
  }
}
