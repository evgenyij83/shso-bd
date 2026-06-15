import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType, AlignmentType, BorderStyle } from 'docx'

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

function cellBorders() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: '000000' }
  return { top: border, bottom: border, left: border, right: border }
}

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

    // Header row
    const headerRow = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ п/п', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 600, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ФИО', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 3000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Учебная группа', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 1500, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'С', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 2000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'По', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 2000, type: WidthType.DXA } }),
      ]
    })

    const dataRows: TableRow[] = []
    let index = 1

    for (const entry of entries as any[]) {
      const monthStr = String(list.month).padStart(2, '0')
      const fromStr = `${String(entry.dayFrom).padStart(2,'0')}.${monthStr}.${list.year} ${entry.timeFrom}`
      const toStr = `${String(entry.dayTo).padStart(2,'0')}.${monthStr}.${list.year} ${entry.timeTo}`

      dataRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: index.toString(), size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders() }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: entry.fighterName, size: 20 })] })], borders: cellBorders() }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: entry.studyGroup || '—', size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders() }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fromStr, size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders() }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: toStr, size: 20 })], alignment: AlignmentType.CENTER })], borders: cellBorders() }),
          ]
        })
      )
      index++
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Пропуск занятий по уважительной причине', bold: true, size: 28 })
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Отряд: ${list.squadName}`, size: 24 })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Период: ${monthName} ${list.year}`, size: 24 })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
          }),
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)

    const safeName = encodeURIComponent(`Smena_${list.squadName.replace(/\s+/g, '_')}_${monthName}_${list.year}`)

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
