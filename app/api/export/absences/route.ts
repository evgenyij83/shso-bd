import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'UNIVERSITY_ADMIN') {
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
  }

  const listId = request.nextUrl.searchParams.get('listId')
  if (!listId) {
    return NextResponse.json({ error: 'Не указан ID списка' }, { status: 400 })
  }

  try {
    const listResult = await sql`
      SELECT al.*, s.name as "squadName"
      FROM "AbsenceList" al
      JOIN "Squad" s ON al."squadId" = s.id
      WHERE al.id = ${listId}
    `
    if (listResult.length === 0) {
      return NextResponse.json({ error: 'Список не найден' }, { status: 404 })
    }

    const list = listResult[0] as any
    const monthName = monthNames[(list.month as number) - 1] || ''

    const entries = await sql`
      SELECT ae.*, f."studyGroup"
      FROM "AbsenceEntry" ae
      LEFT JOIN "Fighter" f ON ae."fighterId" = f.id
      WHERE ae."absenceListId" = ${listId}
      ORDER BY ae."fighterName", ae."dayFrom"
    `

    // Group entries by fighter
    const fightersMap = new Map<string, { name: string, group: string, datesList: any[] }>()
    for (const entry of entries as any[]) {
      if (!fightersMap.has(entry.fighterId)) {
        fightersMap.set(entry.fighterId, {
          name: entry.fighterName,
          group: entry.studyGroup || '—',
          datesList: []
        })
      }
      fightersMap.get(entry.fighterId)!.datesList.push(entry)
    }

    const monthStr = String(list.month).padStart(2, '0')
    const yearStr = String(list.year)

    const fighters = Array.from(fightersMap.values()).map((f, i) => {
      const datesText = f.datesList.map(entry => {
        const dayFromStr = String(entry.dayFrom).padStart(2, '0')
        const monthFromStr = String(entry.monthFrom || list.month).padStart(2, '0')
        const dayToStr = String(entry.dayTo).padStart(2, '0')
        const monthToStr = String(entry.monthTo || list.month).padStart(2, '0')
        return `с ${entry.timeFrom} ${dayFromStr}.${monthFromStr}.${yearStr}\nпо ${entry.timeTo} ${dayToStr}.${monthToStr}.${yearStr};`
      }).join('\n')

      return {
        index: i + 1,
        fullName: f.name,
        studyGroup: f.group,
        dates: datesText
      }
    })

    const templatePath = path.resolve(process.cwd(), 'public/templates/absences_template.docx')
    const content = fs.readFileSync(templatePath, 'binary')

    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    doc.render({
      squadName: list.squadName,
      fighters: fighters
    })

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    })

    const safeName = encodeURIComponent(`Пропуски_${list.squadName.replace(/\s+/g, '_')}_${monthName}_${list.year}`)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${safeName}.docx`
      }
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Ошибка при генерации документа', details: e.message }, { status: 500 })
  }
}
