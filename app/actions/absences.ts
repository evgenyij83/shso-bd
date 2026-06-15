'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'
import { sendVkMessage } from '@/lib/vkBot'

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

const roleLabels: Record<string, string> = {
  'SQUAD_COMMANDER': 'Командир',
  'SQUAD_COMMISSAR': 'Комиссар',
  'HQ_COMMANDER': 'Командир',
  'HQ_COMMISSAR': 'Комиссар',
}

export async function getDraftAbsenceList(squadId: string) {
  const session = await getSession()
  if (!session) return null

  try {
    const result = await sql`
      SELECT al.*, s.name as "squadName"
      FROM "AbsenceList" al
      JOIN "Squad" s ON al."squadId" = s.id
      WHERE al."squadId" = ${squadId} AND al.status = 'DRAFT'
      ORDER BY al."createdAt" DESC LIMIT 1
    `
    if (result.length === 0) return null

    const list = result[0] as any
    const entries = await sql`
      SELECT * FROM "AbsenceEntry" WHERE "absenceListId" = ${list.id} ORDER BY "fighterName", "dayFrom"
    `
    list.entries = entries
    return list
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function createDraftAbsenceList(squadId: string, month: number, year: number) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  try {
    // Проверяем нет ли уже черновика
    const existing = await sql`SELECT id FROM "AbsenceList" WHERE "squadId" = ${squadId} AND status = 'DRAFT'`
    if (existing.length > 0) return { error: 'У вас уже есть активный черновик. Удалите его или отправьте.' }

    const result = await sql`
      INSERT INTO "AbsenceList" (id, "squadId", month, year, status, "createdAt")
      VALUES (gen_random_uuid(), ${squadId}, ${month}, ${year}, 'DRAFT', NOW())
      RETURNING id
    `
    return { success: true, id: result[0].id }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при создании черновика' }
  }
}

export async function addAbsenceEntry(listId: string, fighterId: string, fighterName: string, timeFrom: string, dayFrom: number, timeTo: string, dayTo: number) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  if (!timeFrom || !timeTo) return { error: 'Укажите время' }
  if (!dayFrom || !dayTo) return { error: 'Укажите дни' }

  try {
    await sql`
      INSERT INTO "AbsenceEntry" (id, "absenceListId", "fighterId", "fighterName", "timeFrom", "dayFrom", "timeTo", "dayTo")
      VALUES (gen_random_uuid(), ${listId}, ${fighterId}, ${fighterName}, ${timeFrom}, ${dayFrom}, ${timeTo}, ${dayTo})
    `
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при добавлении записи' }
  }
}

export async function removeAbsenceEntry(entryId: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  try {
    await sql`DELETE FROM "AbsenceEntry" WHERE id = ${entryId}`
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка при удалении записи' }
  }
}

export async function deleteDraftAbsenceList(listId: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  try {
    await sql`DELETE FROM "AbsenceEntry" WHERE "absenceListId" = ${listId}`
    await sql`DELETE FROM "AbsenceList" WHERE id = ${listId} AND status = 'DRAFT'`
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка при удалении черновика' }
  }
}

export async function submitAbsenceList(listId: string, targetAdminUserId: string) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  if (!targetAdminUserId) return { error: 'Выберите руководителя' }

  try {
    // Проверяем что есть записи
    const entries = await sql`SELECT * FROM "AbsenceEntry" WHERE "absenceListId" = ${listId}`
    if (entries.length === 0) return { error: 'Нет записей для отправки' }

    // Получаем данные о списке
    const listResult = await sql`
      SELECT al.*, s.name as "squadName"
      FROM "AbsenceList" al
      JOIN "Squad" s ON al."squadId" = s.id
      WHERE al.id = ${listId}
    `
    if (listResult.length === 0) return { error: 'Список не найден' }
    const list = listResult[0] as any

    // Обновляем статус
    await sql`UPDATE "AbsenceList" SET status = 'SENT', "sentByUserId" = ${session.userId}, "targetAdminUserId" = ${targetAdminUserId} WHERE id = ${listId}`

    const roleName = roleLabels[session.role] || 'Командир'
    const monthName = monthNames[(list.month as number) - 1] || ''

    // Уведомляем руководителя
    const admin = await sql`SELECT "vkLink" FROM "User" WHERE id = ${targetAdminUserId}`
    if (admin[0]?.vkLink) {
      await sendVkMessage(admin[0].vkLink, `${roleName} отряда «${list.squadName}» выслал список на согласование по Уважительным пропускам за ${monthName} ${list.year}.`)
    }

    // Группируем записи по fighterId для VK-уведомлений бойцам
    const fighterEntries: Record<string, any[]> = {}
    for (const entry of entries as any[]) {
      if (!fighterEntries[entry.fighterId]) fighterEntries[entry.fighterId] = []
      fighterEntries[entry.fighterId].push(entry)
    }

    for (const [fighterId, fEntries] of Object.entries(fighterEntries)) {
      const fighter = await sql`SELECT "vkLink" FROM "Fighter" WHERE id = ${fighterId}`
      if (fighter[0]?.vkLink) {
        const dateLines = fEntries.map((e: any) =>
          `${e.dayFrom}.${String(list.month).padStart(2,'0')}.${list.year} ${e.timeFrom} – ${e.dayTo}.${String(list.month).padStart(2,'0')}.${list.year} ${e.timeTo}`
        ).join('\n')
        await sendVkMessage(fighter[0].vkLink, `${roleName} отряда направил на согласование:\n\n${dateLines}`)
      }
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при отправке' }
  }
}

export async function getPendingAbsenceLists() {
  const session = await getSession()
  if (!session || session.role !== 'UNIVERSITY_ADMIN') return []

  try {
    const lists = await sql`
      SELECT al.*, s.name as "squadName", u."fullName" as "senderName", u.role as "senderRole"
      FROM "AbsenceList" al
      JOIN "Squad" s ON al."squadId" = s.id
      LEFT JOIN "User" u ON al."sentByUserId" = u.id
      WHERE al.status = 'SENT' AND al."targetAdminUserId" = ${session.userId}
      ORDER BY al."createdAt" DESC
    `
    return lists
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function getUniversityAdminsForAbsences() {
  const session = await getSession()
  if (!session) return []

  try {
    const admins = await sql`SELECT id, "fullName" FROM "User" WHERE role = 'UNIVERSITY_ADMIN'`
    return admins
  } catch (e) {
    return []
  }
}
