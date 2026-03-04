const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, '../src/namazym/data/quran_ar_full.json');
const tmPath = path.join(__dirname, '../src/namazym/data/quran_tm_full.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const tm = JSON.parse(fs.readFileSync(tmPath, 'utf8'));

const arKeys = Object.keys(ar);
const tmKeys = Object.keys(tm);

console.log(`AR Count: ${arKeys.length}`);
console.log(`TM Count: ${tmKeys.length}`);

if (arKeys.length !== 6236 || tmKeys.length !== 6236) {
    console.error("❌ ERROR: Verse count mismatch or incorrect (Expected 6236)");
    process.exit(1);
}

const missingInTm = arKeys.filter(k => !tm[k]);
const missingInAr = tmKeys.filter(k => !ar[k]);

if (missingInTm.length > 0 || missingInAr.length > 0) {
    console.error("❌ ERROR: Key mismatch detected!");
    console.error("Missing in TM:", missingInTm);
    console.error("Missing in AR:", missingInAr);
    process.exit(1);
}

console.log("✅ SUCCESS: Quran data is 100% consistent (6236 verses).");
