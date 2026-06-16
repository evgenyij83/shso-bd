'use server'

import postgres from 'postgres'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sendVkMessage } from '@/lib/vkBot'

const sql = postgres(process.env.POSTGRES_URL || process.env.DATABASE_URL || '', process.env.NODE_ENV === 'production' ? {} : {})

export async function toggleMaintenanceMode(enable: boolean) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) return { error: 'Не авторизован' }
  
  const users = await sql`SELECT role FROM "User" WHERE id = ${sessionId}`
  if (!users[0] || users[0].role !== 'DEVELOPER') {
    return { error: 'Нет прав' }
  }

  // Обновляем или вставляем настройку
  if (enable) {
    await sql`
      INSERT INTO "SystemSettings" (key, value) 
      VALUES ('MAINTENANCE_MODE', 'true') 
      ON CONFLICT (key) DO UPDATE SET value = 'true'
    `
    // Запускаем рассылку ВК асинхронно, чтобы не блокировать UI надолго
    startStaggeredVkBroadcast()
  } else {
    await sql`
      INSERT INTO "SystemSettings" (key, value) 
      VALUES ('MAINTENANCE_MODE', 'false') 
      ON CONFLICT (key) DO UPDATE SET value = 'false'
    `
  }

  return { success: true }
}

export async function getMaintenanceStatus() {
  const settings = await sql`SELECT value FROM "SystemSettings" WHERE key = 'MAINTENANCE_MODE'`
  if (settings.length > 0 && settings[0].value === 'true') {
    return true
  }
  return false
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

async function startStaggeredVkBroadcast() {
  const message = "Начались технические работы. Единая база ШСО временно недоступна. Приношу извинения за неудобства,\nС любовью, KN";
  
  try {
    // 1. Руководитель университета, командир штаба, комиссар штаба
    const group1 = await sql`SELECT "vkLink" FROM "User" WHERE role IN ('UNIVERSITY_ADMIN', 'HQ_COMMANDER', 'HQ_COMMISSAR') AND "vkLink" IS NOT NULL`
    for (const u of group1) {
      if (u.vkLink) await sendVkMessage(u.vkLink, message)
    }

    await delay(10000)

    // 2. Командир отряда
    const group2 = await sql`SELECT "vkLink" FROM "User" WHERE role = 'SQUAD_COMMANDER' AND "vkLink" IS NOT NULL`
    for (const u of group2) {
      if (u.vkLink) await sendVkMessage(u.vkLink, message)
    }

    await delay(10000)

    // 3. Комиссар отряда
    const group3 = await sql`SELECT "vkLink" FROM "User" WHERE role = 'SQUAD_COMMISSAR' AND "vkLink" IS NOT NULL`
    for (const u of group3) {
      if (u.vkLink) await sendVkMessage(u.vkLink, message)
    }

    await delay(10000)

    // 4. Все остальные (FIGHTER, CANDIDATE)
    const group4 = await sql`SELECT "vkLink" FROM "User" WHERE role NOT IN ('UNIVERSITY_ADMIN', 'HQ_COMMANDER', 'HQ_COMMISSAR', 'SQUAD_COMMANDER', 'SQUAD_COMMISSAR', 'DEVELOPER') AND "vkLink" IS NOT NULL`
    
    // Для последней группы можно отправлять с небольшой задержкой между сообщениями, чтобы не превысить лимит ВК (20 сообщ/сек)
    for (let i = 0; i < group4.length; i++) {
      if (group4[i].vkLink) {
        await sendVkMessage(group4[i].vkLink, message)
        await delay(50) // небольшая задержка
      }
    }
  } catch (err) {
    console.error('Error during staggered VK broadcast:', err)
  }
}
