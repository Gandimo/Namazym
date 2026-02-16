const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const PDF_PATH = path.join(__dirname, '../assets/pdfs/Namaz_kitabym.pdf');
const OUTPUT_PATH = path.join(__dirname, '../src/data/namaz_kitaby.json');

async function extract() {
    if (!fs.existsSync(PDF_PATH)) {
        console.error(`PDF not found at: ${PDF_PATH}`);
        process.exit(1);
    }

    console.log(`Reading PDF from: ${PDF_PATH}`);
    const dataBuffer = fs.readFileSync(PDF_PATH);

    try {
        const data = await pdf(dataBuffer);
        const rawText = data.text;

        console.log(`Extracted ${rawText.length} characters.`);
        console.log(`Pages: ${data.numpages}`);

        // --- PROCESSING ---
        const cleaned = processText(rawText);
        const structured = structureData(cleaned);

        // --- VALIDATION ---
        if (structured.chapters.length === 0) {
            console.error("No chapters found! Extraction failed.");
            process.exit(1);
        }

        // --- OUTPUT ---
        const finalJson = {
            meta: {
                title: "Namaz kitaby",
                lang: "tk",
                source: "pdf",
                pageCount: data.numpages,
                generatedAt: new Date().toISOString()
            },
            chapters: structured.chapters
        };

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalJson, null, 2));
        console.log(`Successfully wrote to: ${OUTPUT_PATH}`);

    } catch (e) {
        console.error("Extraction error:", e);
        process.exit(1);
    }
}

function processText(text) {
    // 1. Remove Page Numbers (e.g. " 2 ", " 3 ")
    // Regex matches isolated numbers on their own lines or surrounded by spaces
    // Conservative approach: remove only lines that are JUST numbers
    let lines = text.split('\n');
    lines = lines.filter(line => !/^\s*\d+\s*$/.test(line));
    lines = lines.filter(line => !line.includes("IslamHouse")); // Remove header/footer if known

    return lines.join('\n');
}

function structureData(text) {
    const chapters = [];
    let currentChapter = null;
    let currentSection = null;

    const lines = text.split('\n');

    // Regex to identify chapter start
    // Adjust based on actual PDF content. Assuming "BAP" or similar.
    // Spec says: "Birinji bap:", "Ikinji bap:" etc.
    const chapterRegex = /^(Birinji|Ikinji|Üçünji|Dördünji|Bäşinji|Altynjy|Ýedinji|Sekizinji|Dokuzynjy|Onunjy)\s+bap/i;

    // Regex for Section: "1.", "2." at start of line
    const sectionRegex = /^\d+\.\s+/;

    let chapterIdCounter = 1;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // CHECK FOR CHAPTER
        if (chapterRegex.test(line)) {
            // Save previous
            if (currentChapter) {
                chapters.push(currentChapter);
            }

            currentChapter = {
                id: `bap_${chapterIdCounter++}`,
                title: line.replace(':', '').trim(),
                sections: []
            };

            // Allow an "Intro" section immediately
            currentSection = { type: 'intro', paragraphs: [] };
            currentChapter.sections.push(currentSection);
            continue;
        }

        // CHECK FOR SUB-HEADING (Numbered)
        if (currentChapter && sectionRegex.test(line)) {
            // New Section
            currentSection = {
                id: `sec_${currentChapter.sections.length}`,
                heading: line,
                paragraphs: []
            };
            currentChapter.sections.push(currentSection);
            continue;
        }

        // NORMAL TEXT
        if (currentChapter) {
            // If line is very short or all caps, might be a heading? 
            // For now treat as paragraph.
            // Merge logic: If previous line ended with hyphen? 
            // Simple logic: just push as paragraph for now.
            if (currentSection) {
                currentSection.paragraphs.push(line);
            } else {
                // Should ideally not happen if we init intro section
                currentSection = { type: 'intro', paragraphs: [line] };
                currentChapter.sections.push(currentSection);
            }
        }
    }

    if (currentChapter) {
        chapters.push(currentChapter);
    }

    return { chapters };
}

extract();
