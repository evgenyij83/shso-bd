'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'
import { sendVkMessage } from '@/lib/vkBot'

export async function submitIdentifierRequest(fullName: string, vkLink: string) {
  if (!fullName || !fullName.trim()) return { error: 'Укажите ФИО' }
  if (!vkLink || !vkLink.trim()) return { error: 'Укажите ссылку на ВК' }

  try {
    // Ищем пользователя по ФИО
    const users = await sql`SELECT id, "fullName", "vkLink" FROM "User" WHERE LOWER("fullName") = LOWER(${fullName.trim()})`
    
    if (users.length === 0) {
      return { error: 'Пользователь с таким ФИО не найден в системе. Обратитесь в университет к ответственному лицу.' }
    }

    // Нормализуем ВК-ссылку для сравнения
    const normalizeVk = (link: string) => {
      if (!link) return ''
      return link.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^(www\.)?vk\.com\//, '')
        .replace(/\/$/, '')
    }

    const inputVk = normalizeVk(vkLink)
    const matchedUser = users.find((u: any) => normalizeVk(u.vkLink || '') === inputVk)

    if (!matchedUser) {
      return { error: 'Ссылка, указанная сейчас и при регистрации не совпадает. Обратитесь в университет к ответственному лицу.' }
    }

    // Проверяем нет ли уже активной заявки
    const existingRequest = await sql`SELECT id FROM "IdentifierRequest" WHERE "userId" = ${matchedUser.id} AND status = 'PENDING'`
    if (existingRequest.length > 0) {
      return { error: 'У вас уже есть активная заявка на смену идентификатора. Дождитесь обработки.' }
    }

    // Создаём заявку
    await sql`
      INSERT INTO "IdentifierRequest" (id, "fullName", "vkLink", "userId", status, "createdAt")
      VALUES (gen_random_uuid(), ${fullName.trim()}, ${vkLink.trim()}, ${matchedUser.id}, 'PENDING', NOW())
    `

    // Уведомляем разработчика
    const developers = await sql`SELECT "vkLink" FROM "User" WHERE role = 'DEVELOPER'`
    for (const dev of developers) {
      if (dev.vkLink) {
        await sendVkMessage(dev.vkLink, `Подана заявка на смену идентификатора.\nОт: ${fullName.trim()}`)
      }
    }

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при отправке заявки' }
  }
}

export async function getIdentifierRequests() {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return []

  try {
    const requests = await sql`
      SELECT ir.*, u."uniqueCode" as "currentCode", u.role
      FROM "IdentifierRequest" ir
      JOIN "User" u ON ir."userId" = u.id
      WHERE ir.status = 'PENDING'
      ORDER BY ir."createdAt" ASC
    `
    return requests
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function processIdentifierRequest(requestId: string, newCode: string) {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') return { error: 'Недостаточно прав' }

  if (!newCode || !newCode.trim()) return { error: 'Укажите новый идентификатор' }

  try {
    // Проверяем что код не занят
    const existingCode = await sql`SELECT id FROM "User" WHERE "uniqueCode" = ${newCode.trim()}`
    if (existingCode.length > 0) return { error: 'Этот код уже используется' }

    // Получаем заявку
    const reqResult = await sql`SELECT * FROM "IdentifierRequest" WHERE id = ${requestId} AND status = 'PENDING'`
    if (reqResult.length === 0) return { error: 'Заявка не найдена' }
    const req = reqResult[0] as any

    // Меняем код
    await sql`UPDATE "User" SET "uniqueCode" = ${newCode.trim()} WHERE id = ${req.userId}`

    // Обновляем заявку
    await sql`UPDATE "IdentifierRequest" SET status = 'PROCESSED', "newCode" = ${newCode.trim()} WHERE id = ${requestId}`

    // Отправляем сообщение в ВК
    await sendVkMessage(req.vkLink, `Ваша заявка на смену идентификатора обработана, ваш новый ключ доступа — ${newCode.trim()}. Сохраните его! Будьте здоровы, богаты, счастливы, удачливы и всех Вам благ!\nС любовью, KN.`)

    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при обработке заявки' }
  }
}
