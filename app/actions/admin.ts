'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function addSquad(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== 'DEVELOPER' && session.role !== 'UNIVERSITY_ADMIN')) return { error: 'Недостаточно прав' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  if (!name) return { error: 'Укажите название отряда' }

  try {
    await sql`INSERT INTO "Squad" (id, name, description) VALUES (gen_random_uuid(), ${name}, ${description || null})`
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка: Возможно отряд с таким названием уже существует' }
  }
}

export async function addUser(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return { error: 'Недостаточно прав' }

  const uniqueCode = formData.get('uniqueCode') as string
  const role = formData.get('role') as string
  const squadId = formData.get('squadId') as string | null

  if (!uniqueCode || !role) return { error: 'Заполните обязательные поля' }
  const isSquadCommander = role === 'SQUAD_COMMANDER' || role === 'SQUAD_COMMISSAR'
  const isHQ = role === 'HQ_COMMANDER' || role === 'HQ_COMMISSAR'
  const isFormRole = isSquadCommander || isHQ

  if (isSquadCommander && !squadId) return { error: 'Для этой роли необходимо выбрать отряд' }

  // ВК-ссылка обязательна для командиров/комиссаров
  if (isFormRole) {
    const vkLinkCheck = formData.get('vkLink') as string
    if (!vkLinkCheck || !vkLinkCheck.trim()) return { error: 'Для этой роли обязательно указать ссылку на ВК' }
  }

  try {
    if (isSquadCommander && squadId) {
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
        return { error: `Аккаунт ${position} штаба уже существует. Удалите старый аккаунт перед созданием нового.` }
      }
    }

    const fullName = formData.get('fullName') as string | null
    const userVkLink = formData.get('vkLink') as string | null

    await sql`INSERT INTO "User" (id, "uniqueCode", role, "squadId", "fullName", "vkLink") VALUES (gen_random_uuid(), ${uniqueCode}, ${role}, ${squadId || null}, ${fullName}, ${userVkLink || null})`
    
    // Автоматическое создание анкеты в списке бойцов
    if (isFormRole && squadId) {
      const fullNameForm = formData.get('fullName') as string
      if (fullNameForm) {
        const faculty = formData.get('faculty') as string || '—'
        const studyGroup = formData.get('studyGroup') as string || '—'
        const courseStr = formData.get('course') as string
        const course = courseStr ? parseInt(courseStr, 10) : 1
        const educationForm = formData.get('educationForm') as string || 'Бюджет'
        const phone = formData.get('phone') as string || '—'
        const vkLink = formData.get('vkLink') as string || null
        
        let position = 'Боец'
        if (role === 'SQUAD_COMMANDER') position = 'Командир'
        if (role === 'SQUAD_COMMISSAR') position = 'Комиссар'
        if (role === 'HQ_COMMANDER') position = 'Командир штаба'
        if (role === 'HQ_COMMISSAR') position = 'Комиссар штаба'

        await sql`
          INSERT INTO "Fighter" (id, "squadId", "fullName", position, faculty, "studyGroup", course, "educationForm", phone, "vkLink") 
          VALUES (gen_random_uuid(), ${squadId}, ${fullNameForm}, ${position}, ${faculty}, ${studyGroup}, ${course}, ${educationForm}, ${phone}, ${vkLink})
        `
      }
    }

    revalidatePath('/dashboard/admin')
    if (squadId) revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка базы данных. Возможно код уже существует.' }
  }
}

export async function deleteUser(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return { error: 'Недостаточно прав' }

  await sql`DELETE FROM "User" WHERE id = ${id} AND role != 'DEVELOPER'`
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function deleteSquad(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return { error: 'Недостаточно прав' }

  // Удаляем связанных пользователей и бойцов перед удалением отряда
  await sql`DELETE FROM "User" WHERE "squadId" = ${id}`
  await sql`DELETE FROM "Fighter" WHERE "squadId" = ${id}`
  await sql`DELETE FROM "Squad" WHERE id = ${id}`
  
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSquadDescription(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  const squadId = formData.get('squadId') as string
  const description = formData.get('description') as string

  const isGlobalAdmin = ['DEVELOPER', 'UNIVERSITY_ADMIN', 'HQ_COMMANDER', 'HQ_COMMISSAR'].includes(session.role)
  const isSquadAdmin = ['SQUAD_COMMANDER', 'SQUAD_COMMISSAR'].includes(session.role) && session.squadId === squadId

  if (!isGlobalAdmin && !isSquadAdmin) return { error: 'Недостаточно прав' }

  try {
    await sql`UPDATE "Squad" SET description = ${description || null} WHERE id = ${squadId}`
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/squad/${squadId}`)
    revalidatePath('/apply')
    revalidatePath(`/apply/${squadId}`)
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка при обновлении описания' }
  }
}

export async function updateSquadChatLink(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Необходима авторизация' }

  const squadId = formData.get('squadId') as string
  const chatLink = formData.get('chatLink') as string

  const isGlobalAdmin = ['DEVELOPER', 'UNIVERSITY_ADMIN', 'HQ_COMMANDER', 'HQ_COMMISSAR'].includes(session.role)
  const isSquadAdmin = ['SQUAD_COMMANDER', 'SQUAD_COMMISSAR'].includes(session.role) && session.squadId === squadId

  if (!isGlobalAdmin && !isSquadAdmin) return { error: 'Недостаточно прав' }

  try {
    await sql`UPDATE "Squad" SET "chatLink" = ${chatLink || null} WHERE id = ${squadId}`
    revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка при обновлении ссылки на чат' }
  }
}

export async function setFighterLimit(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== 'DEVELOPER' && session.role !== 'UNIVERSITY_ADMIN')) return { error: 'Недостаточно прав' }

  const squadId = formData.get('squadId') as string
  const limitStr = formData.get('fighterLimit') as string
  const limit = limitStr && limitStr.trim() !== '' ? parseInt(limitStr, 10) : null

  if (limit !== null) {
    if (limit < 0) return { error: 'Лимит не может быть отрицательным' }
    if (limit > 100) return { error: 'Лимит не может быть больше 100' }
  }

  try {
    await sql`UPDATE "Squad" SET "fighterLimit" = ${limit} WHERE id = ${squadId}`
    revalidatePath(`/dashboard/squad/${squadId}`)
    return { success: true }
  } catch (e) {
    return { error: 'Ошибка при установке лимита бойцов' }
  }
}
