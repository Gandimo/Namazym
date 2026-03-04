const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/namazym/data/ramadan_imsakiye.json');
const raw = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(raw);

// Find Ashgabat (City ID 1)
const ashgabat = data.items.find(c => c.city_id === 1);

if (!ashgabat) {
    console.error("Ashgabat data not found!");
    process.exit(1);
}

// Find Ahal (City ID 2) index
const ahalIndex = data.items.findIndex(c => c.city_id === 2);

if (ahalIndex !== -1) {
    // Replace Ahal data with deep copy of Ashgabat data
    const ahalCopy = JSON.parse(JSON.stringify(ashgabat));
    ahalCopy.city_id = 2;
    data.items[ahalIndex] = ahalCopy;
    console.log("Ahal data replaced with Ashgabat copy.");
} else {
    // Create new
    const ahalCopy = JSON.parse(JSON.stringify(ashgabat));
    ahalCopy.city_id = 2;
    data.items.push(ahalCopy);
    console.log("Ahal data added as Ashgabat copy.");
}

// Save back
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
console.log("Done.");
