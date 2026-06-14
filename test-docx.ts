import { Document, Packer, Paragraph, TextRun } from 'docx'

async function test() {
  try {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Hello', bold: true })
            ]
          })
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    console.log('Success, buffer length:', buffer.length)
  } catch (e) {
    console.error('Error generating document:', e)
  }
}

test()
