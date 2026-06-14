import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'UNIVERSITY_ADMIN') {
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
  }

  const nominationId = request.nextUrl.searchParams.get('nominationId')
  if (!nominationId) {
    return NextResponse.json({ error: 'Не указан ID номинации' }, { status: 400 })
  }

  try {
    const nomination = await sql`
      SELECT an.*, s.name as "squadName"
      FROM "AwardNomination" an
      JOIN "Squad" s ON an."squadId" = s.id
      WHERE an.id = ${nominationId}
    `
    if (nomination.length === 0) {
      return NextResponse.json({ error: 'Номинация не найдена' }, { status: 404 })
    }

    const nom = nomination[0] as any

    const nominees = await sql`
      SELECT * FROM "AwardNominee" 
      WHERE "nominationId" = ${nominationId} 
      AND "approvedByUni" = true
    `

    const children: any[] = [
      new Paragraph({
        children: [
          new TextRun({ text: 'Претенденты на награждение', bold: true, size: 32 })
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Отряд: ${nom.squadName}`, size: 24 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
    ]

    ;(nominees as any[]).forEach((nominee, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. ${nominee.fighterName}`, bold: true, size: 24 })
          ],
          spacing: { before: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: nominee.description, size: 22 })
          ],
          spacing: { after: 200 }
        })
      )
    })

    const doc = new Document({
      sections: [{
        children
      }]
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''awards_${encodeURIComponent(nom.squadName.replace(/\s+/g, '_'))}.docx`
      }
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Ошибка при генерации документа', details: e.message, stack: e.stack }, { status: 500 })
  }
}
