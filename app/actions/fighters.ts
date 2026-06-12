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

  await sql`
    INSERT INTO "Fighter" (id, "squadId", "fullName", position, faculty, "studyGroup", course, "educationForm", phone, "vkLink") 
    VALUES (gen_random_uuid(), ${squadId}, ${fullName}, ${position}, ${faculty}, ${studyGroup}, ${course}, ${educationForm}, ${phone}, ${vkLink})
  `

  revalidatePath(`/dashboard/squad/${squadId}`)
  return { success: true }
}

export async function deleteFighter(fighterId: string, squadId: string) {
  const session = await getSession()
  if (!session) return { error: 'Не авторизован' }
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== squadId) return { error: 'Нет прав' }

  await sql`DELETE FROM "Fighter" WHERE id = ${fighterId}`
  revalidatePath(`/dashboard/squad/${squadId}`)
  return { success: true }
}
