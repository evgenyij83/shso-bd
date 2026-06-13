import { NextResponse } from 'next/server'
import { getSession } from '@/app/actions/auth'
import sql from '@/lib/db'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType } from 'docx'

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

    const sections = []

    for (const squad of squads as any[]) {
      const squadFighters = fighters.filter((f: any) => f.squadId === squad.id)
      
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ФИО", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Должность", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Факультет", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Группа", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Курс", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Форма", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Телефон", bold: true })] })] }),
          ]
        })
      ]

      for (const f of squadFighters as any[]) {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: f.fullName })] }),
              new TableCell({ children: [new Paragraph({ text: f.position })] }),
              new TableCell({ children: [new Paragraph({ text: f.faculty })] }),
              new TableCell({ children: [new Paragraph({ text: f.studyGroup })] }),
              new TableCell({ children: [new Paragraph({ text: f.course.toString() })] }),
              new TableCell({ children: [new Paragraph({ text: f.educationForm })] }),
              new TableCell({ children: [new Paragraph({ text: f.phone })] }),
            ]
          })
        )
      }

      sections.push({
        properties: {},
        children: [
          new Paragraph({
            text: `Сводка по отряду: ${squad.name}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: `Всего бойцов: ${squadFighters.length}` }),
          new Paragraph({ text: "" }), // empty line
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          }),
          new Paragraph({ text: "" }), // spacing between squads
        ]
      })
    }

    const doc = new Document({ sections })
    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="svodka_po_otryadam.docx"',
      }
    })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
