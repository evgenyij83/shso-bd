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

    // Group entries by fighter
    const fightersMap = new Map<string, { name: string, group: string, dates: any[] }>()
    for (const entry of entries as any[]) {
      if (!fightersMap.has(entry.fighterId)) {
        fightersMap.set(entry.fighterId, {
          name: entry.fighterName,
          group: entry.studyGroup || '—',
          dates: []
        })
      }
      fightersMap.get(entry.fighterId)!.dates.push(entry)
    }

    // Header row
    const headerRow = new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ п/п', size: 24 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 600, type: WidthType.DXA }, verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ФИО', size: 24 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 3000, type: WidthType.DXA }, verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Учебная группа', size: 24 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 1500, type: WidthType.DXA }, verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Даты пропуска занятий в связи с работой в студенческом отряде', size: 24 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), width: { size: 4000, type: WidthType.DXA }, verticalAlign: 'center' }),
      ]
    })

    const dataRows: TableRow[] = []
    let index = 1

    const monthStr = String(list.month).padStart(2, '0')
    const yearStr = String(list.year)

    for (const [_, fighterData] of Array.from(fightersMap.entries())) {
      const datesParagraphs = fighterData.dates.flatMap((entry, i) => {
        const dayFromStr = String(entry.dayFrom).padStart(2, '0')
        const dayToStr = String(entry.dayTo).padStart(2, '0')
        
        return [
          new Paragraph({ children: [new TextRun({ text: `с ${entry.timeFrom} ${dayFromStr}.${monthStr}.${yearStr}`, size: 24 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `по ${entry.timeTo} ${dayToStr}.${monthStr}.${yearStr};`, size: 24 })], alignment: AlignmentType.CENTER })
        ]
      })

      dataRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: index.toString(), size: 24 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), verticalAlign: 'center' }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fighterData.name, size: 24 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), verticalAlign: 'center' }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fighterData.group, size: 24 })], alignment: AlignmentType.CENTER })], borders: cellBorders(), verticalAlign: 'center' }),
            new TableCell({ children: datesParagraphs, borders: cellBorders(), verticalAlign: 'center' }),
          ]
        })
      )
      index++
    }

    const noBorders = {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
          }
        },
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorders,
                    width: { size: 5000, type: WidthType.DXA },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'ФГБОУ ВО СГУПС', bold: true, size: 24 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'Центр карьеры Управления по', size: 24 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'связям с производством', size: 24 })], spacing: { after: 200 } }),
                      new Paragraph({ children: [new TextRun({ text: 'ДОКЛАДНАЯ ЗАПИСКА', bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                      new Paragraph({ children: [new TextRun({ text: '№ ___________________', size: 24 })], spacing: { after: 200 } }),
                      new Paragraph({ children: [new TextRun({ text: 'О пропуске занятий по', bold: true, size: 24 })] }),
                      new Paragraph({ children: [new TextRun({ text: 'уважительной причине', bold: true, size: 24 })], spacing: { after: 200 } }),
                    ]
                  }),
                  new TableCell({
                    borders: noBorders,
                    width: { size: 4000, type: WidthType.DXA },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Деканам факультетов', size: 24 })], alignment: AlignmentType.RIGHT })
                    ]
                  })
                ]
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `\tВ связи с участием следующих обучающихся в студенческом отряде «${list.squadName}», прошу считать пропуск занятий в указанные даты по уважительной причине:`, size: 24 })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '', size: 24 })
            ],
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Начальник центра карьеры Управления', size: 24 }),
            ],
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'по связям с производством\t\t\t\t\tН.А. Баранов', size: 24 })
            ],
            alignment: AlignmentType.LEFT,
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
