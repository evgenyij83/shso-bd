import { NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import sql from '@/lib/db'
import ExcelJS from 'exceljs'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { squadIds, all } = await req.json()

    let allowedSquadIds: string[] = []

    if (session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') {
      if (!session.squadId) return new NextResponse('Forbidden', { status: 403 })
      allowedSquadIds = [session.squadId]
    } else {
      if (all) {
        const squads = await sql`SELECT id FROM "Squad"`
        allowedSquadIds = squads.map((s: any) => s.id)
      } else {
        if (!Array.isArray(squadIds) || squadIds.length === 0) {
          return new NextResponse('Bad Request: No squads selected', { status: 400 })
        }
        allowedSquadIds = squadIds
      }
    }

    if (allowedSquadIds.length === 0) {
      return new NextResponse('Bad Request: No squads found', { status: 400 })
    }

    const squads = await sql`SELECT id, name FROM "Squad" WHERE id = ANY(${allowedSquadIds}) ORDER BY name ASC`
    const fighters = await sql`SELECT * FROM "Fighter" WHERE "squadId" = ANY(${allowedSquadIds}) ORDER BY position DESC, "fullName" ASC`

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Сводка по отрядам')

    sheet.columns = [
      { header: 'Отряд', key: 'squadName', width: 25 },
      { header: 'ФИО', key: 'fullName', width: 35 },
      { header: 'Должность', key: 'position', width: 15 },
      { header: 'Факультет', key: 'faculty', width: 20 },
      { header: 'Группа', key: 'studyGroup', width: 15 },
      { header: 'Курс', key: 'course', width: 10 },
      { header: 'Форма обучения', key: 'educationForm', width: 20 },
      { header: 'Телефон', key: 'phone', width: 20 },
      { header: 'ВК', key: 'vkLink', width: 30 },
    ]

    sheet.getRow(1).font = { bold: true }

    for (const squad of squads as any[]) {
      const squadFighters = fighters.filter((f: any) => f.squadId === squad.id)
      for (const f of squadFighters as any[]) {
        sheet.addRow({
          squadName: squad.name,
          fullName: f.fullName,
          position: f.position,
          faculty: f.faculty,
          studyGroup: f.studyGroup,
          course: f.course,
          educationForm: f.educationForm,
          phone: f.phone,
          vkLink: f.vkLink || '',
        })
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="svodka_po_otryadam.xlsx"',
      }
    })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
