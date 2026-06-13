import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { sendVkMessage } from '@/lib/vkBot'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Подтверждение сервера (VK Callback API)
    if (body.type === 'confirmation') {
      const confirmationCode = process.env.VK_CONFIRMATION_CODE || 'abd3d1db'
      return new NextResponse(confirmationCode, { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }

    // 2. Обработка новой заявки из формы
    if (body.type === 'lead_forms_new') {
      const answers = body.object.answers || []
      const userId = body.object.user_id

      // Создаем удобный объект ответов, где ключи - это тексты вопросов в нижнем регистре
      const data: Record<string, string> = {}
      answers.forEach((ans: any) => {
        const questionText = (ans.question || '').toLowerCase().trim()
        data[questionText] = ans.answer || ''
      })

      // Ищем нужные поля (ВК формы могут иметь разные названия вопросов, ищем по подстрокам)
      const findAnswer = (keywords: string[]) => {
        const key = Object.keys(data).find(k => keywords.some(keyword => k.includes(keyword)))
        return key ? data[key] : ''
      }

      // Если в форме есть стандартные поля ВК (Имя, Фамилия)
      let fullName = findAnswer(['фио', 'имя', 'фамилия'])
      // Если ВК передал отдельно
      const firstNameAns = answers.find((a: any) => a.key === 'first_name')?.answer || ''
      const lastNameAns = answers.find((a: any) => a.key === 'last_name')?.answer || ''
      if (!fullName && firstNameAns) {
        fullName = `${lastNameAns} ${firstNameAns}`.trim()
      }

      const phone = answers.find((a: any) => a.key === 'phone_number')?.answer || findAnswer(['телефон', 'номер'])
      const faculty = findAnswer(['факультет', 'институт'])
      const studyGroup = findAnswer(['группа'])
      const courseStr = findAnswer(['курс'])
      const educationForm = findAnswer(['форма обучения', 'бюджет', 'коммерция'])
      const squadName = findAnswer(['отряд', 'какой отряд'])

      const course = parseInt(courseStr.replace(/\D/g, ''), 10) || 1
      const vkLink = `https://vk.com/id${userId}`

      if (!squadName || !fullName || !faculty || !studyGroup || !phone) {
        console.error('VK Webhook Error: Недостаточно данных в анкете', { data, answers })
        return new NextResponse('ok') // Все равно возвращаем ok, чтобы ВК не повторял запрос
      }

      // Ищем отряд по названию
      const squadResult = await sql`SELECT id, name FROM "Squad" WHERE name ILIKE ${'%' + squadName + '%'}`
      const squad = squadResult[0]

      if (!squad) {
        console.error(`VK Webhook Error: Отряд с названием "${squadName}" не найден в БД.`)
        await sendVkMessage(vkLink, `К сожалению, мы не нашли отряд с названием "${squadName}". Пожалуйста, проверьте правильность названия или обратитесь к руководителю.`)
        return new NextResponse('ok')
      }

      // Сохраняем заявку
      await sql`
        INSERT INTO "Application" (id, "squadId", "fullName", "faculty", "studyGroup", "course", "educationForm", "phone", "vkLink") 
        VALUES (gen_random_uuid(), ${squad.id}, ${fullName}, ${faculty}, ${studyGroup}, ${course}, ${educationForm || 'Бюджет'}, ${phone}, ${vkLink})
      `

      // Отправляем уведомление
      await sendVkMessage(vkLink, `Ваша заявка на вступление в ${squad.name} принята в обработку через форму ВКонтакте!`)

      return new NextResponse('ok')
    }

    // Возвращаем 'ok' на любые другие типы событий, чтобы ВК понял, что мы всё получили
    return new NextResponse('ok')
  } catch (error) {
    console.error('VK Webhook Error:', error)
    return new NextResponse('ok')
  }
}
