const fs = require('fs');
const path = require('path');

const svgData = fs.readFileSync('src/namazym/assets/hero/hero-fajr-kaaba-clean.svg', 'utf8');

// Match <image ... xlink:href="data:image/png;base64,..." />
const regex = /data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)/g;
let match;
let count = 0;

while ((match = regex.exec(svgData)) !== null) {
  const ext = match[1];
  const b64 = match[2];
  const buffer = Buffer.from(b64, 'base64');
  
  const outFile = `fajr_extracted_${count}.${ext}`;
  fs.writeFileSync(outFile, buffer);
  console.log(`Extracted ${outFile} (size: ${buffer.length} bytes)`);
  count++;
}

if (count === 0) {
  console.log("No base64 images found!");
}
