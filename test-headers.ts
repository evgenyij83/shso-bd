import { NextResponse } from 'next/server'

async function test() {
  try {
    const squadName = "ССО Мечта"
    const res = new NextResponse(new ArrayBuffer(10), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=awards_${squadName.replace(/\s+/g, '_')}.docx`
      }
    })
    console.log('Success!', res.headers.get('content-disposition'))
  } catch (e) {
    console.error('Error generating document:', e)
  }
}

test()
