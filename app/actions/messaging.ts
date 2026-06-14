'use server'

import sql from '@/lib/db'
import { getSession } from './auth'
import { sendVkMessage } from '@/lib/vkBot'

const roleLabels: Record<string, string> = {
  'UNIVERSITY_ADMIN': 'Руководство Университета',
  'HQ_COMMANDER': 'Командир Штаба',
  'HQ_COMMISSAR': 'Комиссар Штаба',
  'SQUAD_COMMANDER': 'Командир Отряда',
  'SQUAD_COMMISSAR': 'Комиссар Отряда',
  'DEVELOPER': 'Разработчик'
}

export async function getAvailableRecipients() {
  const session = await getSession()
  if (!session || session.role !== 'UNIVERSITY_ADMIN') return []

  try {
    const users = await sql`
      SELECT u.id, u."fullName", u.role, u."vkLink", s.name as "squadName"
      FROM "User" u
      LEFT JOIN "Squad" s ON u."squadId" = s.id
      WHERE u.id != ${session.userId}
      ORDER BY u.role, u."fullName"
    `
    return users.map((u: any) => ({
      id: u.id,
      fullName: u.fullName || 'Имя не указано',
      role: roleLabels[u.role] || u.role,
      squadName: u.squadName || null,
      hasVk: !!u.vkLink
    }))
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function sendBulkMessage(recipientIds: string[], message: string) {
  const session = await getSession()
  if (!session || session.role !== 'UNIVERSITY_ADMIN') return { error: 'Недостаточно прав' }

  if (!recipientIds || recipientIds.length === 0) return { error: 'Выберите хотя бы одного получателя' }
  if (!message || !message.trim()) return { error: 'Введите текст сообщения' }

  try {
    const senderName = session.fullName || 'Руководитель'
    const messageText = `У вас новое сообщение от ${senderName}:\n${message.trim()}`

    const recipients = await sql`SELECT id, "vkLink" FROM "User" WHERE id = ANY(${recipientIds})`
    
    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      if (recipient.vkLink) {
        await sendVkMessage(recipient.vkLink, messageText)
        sent++
      } else {
        failed++
      }
    }

    return { 
      success: true, 
      message: `Сообщение отправлено: ${sent} из ${recipients.length}` + (failed > 0 ? `. Не удалось доставить: ${failed} (ВК не указан).` : '')
    }
  } catch (e) {
    console.error(e)
    return { error: 'Ошибка при отправке сообщений' }
  }
}
