'use server'

import { revalidatePath } from 'next/cache'
import sql from '@/lib/db'
import { sendVkMessage } from '@/lib/vkBot'

export async function submitApplication(formData: FormData) {
  const squadId = formData.get('squadId') as string
  const fullName = formData.get('fullName') as string
  const faculty = formData.get('faculty') as string
  const studyGroup = formData.get('studyGroup') as string
  const course = parseInt(formData.get('course') as string, 10)
  const educationForm = formData.get('educationForm') as string
  const phone = formData.get('phone') as string
  const vkLink = formData.get('vkLink') as string

  if (!squadId || !fullName || !faculty || !studyGroup || !course || !educationForm || !phone || !vkLink) {
    return { error: 'Пожалуйста, заполните все поля, включая ссылку на ВКонтакте' }
  }

  try {
    await sql`
      INSERT INTO "Application" (id, "squadId", "fullName", "faculty", "studyGroup", "course", "educationForm", "phone", "vkLink") 
      VALUES (gen_random_uuid(), ${squadId}, ${fullName}, ${faculty}, ${studyGroup}, ${course}, ${educationForm}, ${phone}, ${vkLink})
    `

    // Получаем название отряда для красивого сообщения
    const squadInfo = await sql`SELECT name FROM "Squad" WHERE id = ${squadId}`
    const squadName = squadInfo[0]?.name || 'выбранный отряд'

    await sendVkMessage(vkLink, `Ваша заявка на вступление в ${squadName} принята в обработку.`)

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Произошла ошибка при отправке заявки. Попробуйте позже.' }
  }
}
