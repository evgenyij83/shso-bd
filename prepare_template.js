const fs = require('fs');
const path = require('path');

// Read the unzipped XML
let xml = fs.readFileSync('C:/Users/UserPc/Desktop/pravki_unzipped/word/document.xml', 'utf-8');

// 1. Replace "Смена"
xml = xml.replace('Смена', '{squadName}');

// 2. Loop row
// The row has "Бажанов". We can find the <w:tr> containing it.
const rowStartIdx = xml.lastIndexOf('<w:tr ', xml.indexOf('Бажанов'));
let rowEndIdx = xml.indexOf('</w:tr>', rowStartIdx) + 7;
let rowXml = xml.substring(rowStartIdx, rowEndIdx);

// The row has 4 cells. Let's find all <w:tc>
const cells = [];
let idx = 0;
while (true) {
  const start = rowXml.indexOf('<w:tc ', idx);
  if (start === -1) {
    const start2 = rowXml.indexOf('<w:tc>', idx);
    if (start2 === -1) break;
    idx = start2;
  } else {
    idx = start;
  }
  const end = rowXml.indexOf('</w:tc>', idx) + 7;
  cells.push(rowXml.substring(idx, end));
  idx = end;
}

if (cells.length === 4) {
  // Replace contents of first cell:
  // It has "1". Replace "1" with "{#fighters}{index}"
  cells[0] = cells[0].replace('1</w:t>', '{#fighters}{index}</w:t>');
  
  // Cell 1: Бажанов Иван Александрович -> {fullName}
  cells[1] = cells[1].replace('Бажанов Иван Александрович</w:t>', '{fullName}</w:t>');
  
  // Cell 2: ИВБ-411 -> {studyGroup}
  cells[2] = cells[2].replace('ИВБ-411</w:t>', '{studyGroup}</w:t>');
  
  // Cell 3: dates -> replace entire paragraph contents with a single run {dates}{/fighters}
  // Wait, the dates cell has many paragraphs. Let's keep the cell properties, and just put one paragraph with the tag.
  const tcPrStart = cells[3].indexOf('<w:tcPr');
  let tcPr = '';
  if (tcPrStart !== -1) {
    const tcPrEnd = cells[3].indexOf('</w:tcPr>') + 9;
    tcPr = cells[3].substring(tcPrStart, tcPrEnd);
  }
  cells[3] = `<w:tc>${tcPr}<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>{dates}{/fighters}</w:t></w:r></w:p></w:tc>`;
  
  // Reconstruct row
  const newRowXml = rowXml.substring(0, rowXml.indexOf('<w:tc')) + cells.join('') + '</w:tr>';
  xml = xml.replace(rowXml, newRowXml);
  
  fs.writeFileSync('C:/Users/UserPc/Desktop/pravki_unzipped/word/document.xml', xml);
  console.log('Successfully prepared XML!');
} else {
  console.log('Error: Found ' + cells.length + ' cells instead of 4.');
}
