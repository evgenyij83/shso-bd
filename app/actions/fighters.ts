'use server'
import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function addFighter(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }

  const squadId = formData.get('squadId') as string
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== squadId) {
    return { error: 'У вас нет прав редактировать чужой отряд' }
  }

  const fullName = formData.get('fullName') as string
  const position = formData.get('position') as string
  const faculty = formData.get('faculty') as string
  const studyGroup = formData.get('studyGroup') as string
  const course = parseInt(formData.get('course') as string, 10)
  const educationForm = formData.get('educationForm') as string
  const phone = formData.get('phone') as string
  const vkLink = formData.get('vkLink') as string || null

  if (!fullName || !position || !faculty || !studyGroup || !course || !educationForm || !phone) {
    return { error: 'Пожалуйста, заполните все обязательные поля' }
  }

  if (position === 'Командир' || position === 'Комиссар') {
    const existing = await sql`SELECT id FROM "Fighter" WHERE "squadId" = ${squadId} AND position = ${position}`
    if (existing.length > 0) {
      return { error: `В этом отряде уже есть ${position.toLowerCase()}.` }
    }
  }

  const squadResult = await sql`SELECT "fighterLimit" FROM "Squad" WHERE id = ${squadId}`
  const fighterLimit = squadResult[0]?.fighterLimit

  let finalPosition = position
  let warningMessage = undefined

  if (fighterLimit !== null && position !== 'Кандидат') {
    const activeFightersCountResult = await sql`SELECT COUNT(*) as count FROM "Fighter" WHERE "squadId" = ${squadId} AND position != 'Кандидат'`
    const activeFightersCount = parseInt(activeFightersCountResult[0].count, 10)
    if (activeFightersCount >= fighterLimit) {
      finalPosition = 'Кандидат'
      warningMessage = `Лимит бойцов (${fighterLimit}) исчерпан. Пользователь добавлен в статусе "Кандидат".`
    }
  }

  await sql`
    INSERT INTO "Fighter" (id, "squadId", "fullName", position, faculty, "studyGroup", course, "educationForm", phone, "vkLink") 
    VALUES (gen_random_uuid(), ${squadId}, ${fullName}, ${finalPosition}, ${faculty}, ${studyGroup}, ${course}, ${educationForm}, ${phone}, ${vkLink})
  `

  revalidatePath(`/dashboard/squad/${squadId}`)
  return { success: true, warning: warningMessage }
}

export async function deleteFighter(fighterId: string, squadId: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== squadId) return { error: 'Нет прав' }

  await sql`DELETE FROM "Fighter" WHERE id = ${fighterId}`
  revalidatePath(`/dashboard/squad/${squadId}`)
  return { success: true }
}

export async function editFighter(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }

  const fighterId = formData.get('fighterId') as string
  const squadId = formData.get('squadId') as string
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== squadId) {
    return { error: 'У вас нет прав редактировать чужой отряд' }
  }

  const fullName = formData.get('fullName') as string
  const position = formData.get('position') as string
  const faculty = formData.get('faculty') as string
  const studyGroup = formData.get('studyGroup') as string
  const course = parseInt(formData.get('course') as string, 10)
  const educationForm = formData.get('educationForm') as string
  const phone = formData.get('phone') as string
  const vkLink = formData.get('vkLink') as string || null

  if (!fullName || !position || !faculty || !studyGroup || !course || !educationForm || !phone) {
    return { error: 'Пожалуйста, заполните все обязательные поля' }
  }

  const currentFighterRes = await sql`SELECT position FROM "Fighter" WHERE id = ${fighterId}`
  if (currentFighterRes.length === 0) return { error: 'Боец не найден' }
  const currentPosition = currentFighterRes[0].position

  if ((position === 'Командир' || position === 'Комиссар') && currentPosition !== position) {
    const existing = await sql`SELECT id FROM "Fighter" WHERE "squadId" = ${squadId} AND position = ${position} AND id != ${fighterId}`
    if (existing.length > 0) {
      return { error: `В этом отряде уже есть ${position.toLowerCase()}.` }
    }
  }

  if (currentPosition === 'Кандидат' && position !== 'Кандидат') {
    const squadResult = await sql`SELECT "fighterLimit" FROM "Squad" WHERE id = ${squadId}`
    const fighterLimit = squadResult[0]?.fighterLimit

    if (fighterLimit !== null) {
      const activeFightersCountResult = await sql`SELECT COUNT(*) as count FROM "Fighter" WHERE "squadId" = ${squadId} AND position != 'Кандидат'`
      const activeFightersCount = parseInt(activeFightersCountResult[0].count, 10)
      if (activeFightersCount >= fighterLimit) {
        return { error: `Лимит бойцов (${fighterLimit}) исчерпан. Вы не можете изменить статус кандидата.` }
      }
    }
  }

  await sql`
    UPDATE "Fighter" 
    SET "fullName" = ${fullName}, position = ${position}, faculty = ${faculty}, "studyGroup" = ${studyGroup}, course = ${course}, "educationForm" = ${educationForm}, phone = ${phone}, "vkLink" = ${vkLink}
    WHERE id = ${fighterId}
  `

  revalidatePath(`/dashboard/squad/${squadId}`)
  return { success: true }
}

export async function transferFighter(fighterId: string, newSquadId: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }
  if (session.role !== 'HQ_COMMANDER' && session.role !== 'HQ_COMMISSAR' && session.role !== 'DEVELOPER') {
    return { error: 'Недостаточно прав для перевода' }
  }

  try {
    const fighterResult = await sql`SELECT "fullName", "squadId" FROM "Fighter" WHERE id = ${fighterId}`
    if (fighterResult.length === 0) return { error: 'Боец не найден' }
    const fighter = fighterResult[0] as any
    const oldSquadId = fighter.squadId

    if (oldSquadId === newSquadId) return { error: 'Боец уже в этом отряде' }

    const oldSquadResult = await sql`SELECT name FROM "Squad" WHERE id = ${oldSquadId}`
    const newSquadResult = await sql`SELECT name FROM "Squad" WHERE id = ${newSquadId}`
    
    await sql`UPDATE "Fighter" SET "squadId" = ${newSquadId} WHERE id = ${fighterId}`

    revalidatePath(`/dashboard/squad/${oldSquadId}`)
    revalidatePath(`/dashboard/squad/${newSquadId}`)

    // Уведомление командирам старого и нового отрядов
    const oldCmds = await sql`SELECT "vkLink" FROM "User" WHERE "squadId" = ${oldSquadId} AND role IN ('SQUAD_COMMANDER', 'SQUAD_COMMISSAR') AND "vkLink" IS NOT NULL`
    const newCmds = await sql`SELECT "vkLink" FROM "User" WHERE "squadId" = ${newSquadId} AND role IN ('SQUAD_COMMANDER', 'SQUAD_COMMISSAR') AND "vkLink" IS NOT NULL`
    
    const { sendVkMessage } = await import('@/lib/vkBot')
    const msg = `${session.fullName} переводит бойца ${fighter.fullName} в отряд ${newSquadResult[0]?.name}`

    for (const u of oldCmds as any[]) {
      await sendVkMessage(u.vkLink, msg)
    }
    for (const u of newCmds as any[]) {
      await sendVkMessage(u.vkLink, msg)
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при переводе бойца' }
  }
}
