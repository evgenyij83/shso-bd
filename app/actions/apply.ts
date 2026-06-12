'use server'

import sql from '@/lib/db'

export async function submitApplication(formData: FormData) {
  const squadId = formData.get('squadId') as string
  const fullName = formData.get('fullName') as string
  const faculty = formData.get('faculty') as string
  const studyGroup = formData.get('studyGroup') as string
  const course = parseInt(formData.get('course') as string, 10)
  const educationForm = formData.get('educationForm') as string
  const phone = formData.get('phone') as string
  const vkLink = formData.get('vkLink') as string || null

  if (!squadId || !fullName || !faculty || !studyGroup || !course || !educationForm || !phone) {
    return { error: 'Пожалуйста, заполните все обязательные поля' }
  }

  try {
    await sql`
      INSERT INTO "Application" ("squadId", "fullName", "faculty", "studyGroup", "course", "educationForm", "phone", "vkLink") 
      VALUES (${squadId}, ${fullName}, ${faculty}, ${studyGroup}, ${course}, ${educationForm}, ${phone}, ${vkLink})
    `
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Произошла ошибка при отправке заявки. Попробуйте позже.' }
  }
}
