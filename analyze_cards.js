const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/namazym/data/daily_cards.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Total cards: ${data.cards.length}`);

// Check distribution of Surahs
const surahs = {};
data.cards.forEach(c => {
    const s = c.ayat.surah;
    surahs[s] = (surahs[s] || 0) + 1;
});

console.log('Surah distribution:', surahs);
console.log('Sample days:', data.cards.slice(0, 3).map(c => c.day_of_year));
