const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const PDF_PATH = path.join(__dirname, '../assets/pdfs/Namaz_kitabym.pdf');
const OUTPUT_PATH = path.join(__dirname, '../src/namazym/data/namaz_kitaby/tk_namaz_kitaby.json');

async function extractBook() {
    console.log(`Reading PDF from: ${PDF_PATH}`);

    let parse = pdf;
    // Check if it's an object with a default property (ESM interop)
    if (typeof parse !== 'function' && parse.default) {
        parse = parse.default;
    }

    // If it is still not a function, log keys to debug
    if (typeof parse !== 'function') {
        console.error('pdf-parse export is not a function:', parse);
        console.error('Keys:', Object.keys(parse));
        // Fallback or exit
    }

    try {
        const dataBuffer = fs.readFileSync(PDF_PATH);
        const data = await parse(dataBuffer);

        const fullText = data.text;
        console.log(`Extracted ${fullText.length} characters.`);

        // --- PARSING LOGIC ---
        // 1. Normalize Text
        let cleanText = fullText
            .replace(/\r\n/g, '\n')
            .replace(/ +/g, ' ') // Collapse spaces
            .replace(/(\w)-\n(\w)/g, '$1$2'); // Fix hyphenation

        // 2. Split by Chapters ("Bap")
        // Pattern: "Birinji bap", "Ikinji bap", etc. 
        // We'll look for these markers.

        const chapterMarkers = [
            "Birinji bap", "Ikinji bap", "Üçünji bap", "Dördünji bap", "Bäşinji bap",
            "Altynjy bap", "Ýedinji bap", "Sekizinji bap", "Dokuzynjy bap", "Onunjy bap",
            "On birinji bap", "On ikinji bap", "On üçünji bap", "On dördünji bap", "On bäşinji bap"
        ];

        let chapters = [];
        let currentText = cleanText;

        for (let i = 0; i < chapterMarkers.length; i++) {
            const marker = chapterMarkers[i];
            const nextMarker = chapterMarkers[i + 1];

            const startIndex = currentText.indexOf(marker);

            if (startIndex === -1) {
                console.warn(`Warning: Marker "${marker}" not found.`);
                continue;
            }

            let endIndex = -1;
            if (nextMarker) {
                endIndex = currentText.indexOf(nextMarker, startIndex + marker.length);
            }

            let chapterContent = "";
            if (endIndex !== -1) {
                chapterContent = currentText.substring(startIndex, endIndex);
            } else {
                // Last chapter
                chapterContent = currentText.substring(startIndex);
            }

            if (chapterContent) {
                // Process Chapter Content
                const lines = chapterContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                // Heuristic: First line is title (the marker itself or line after)
                const title = lines[0]; // "Birinji bap"
                // Maybe look for a subtitle?
                let sections = [];
                let currentSection = { heading: "Giriş", paragraphs: [] };

                for (let j = 1; j < lines.length; j++) {
                    const line = lines[j];

                    // Heuristic for Section Headings:
                    // Short lines, all caps? or specific patterns?
                    // For now, let's treat lines ending with "?" or extremely short bold-looking lines as headers
                    // OR just lump everything into paragraphs for V1 to ensure we don't lose data.
                    // Better: "Giriş" -> separate section.

                    // Simple logic: Just paragraphs for now. Reader can handle them.
                    currentSection.paragraphs.push(line);
                }
                sections.push(currentSection);

                chapters.push({
                    id: `ch${i + 1}`,
                    title: title,
                    sections: sections
                });
            }
        }

        const dataset = {
            language: "tk",
            bookId: "namaz_kitaby",
            title: "Namaz Kitaby",
            chapters: chapters,
            meta: {
                source: "Namaz_kitabym.pdf",
                extractedAt: new Date().toISOString(),
                totalChapters: chapters.length
            }
        };

        // Validate
        if (chapters.length === 0) {
            throw new Error("No chapters extracted! Check markers.");
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2));
        console.log(`✅ Success! Wrote to ${OUTPUT_PATH}`);
        console.log(`Total Chapters: ${chapters.length}`);

    } catch (e) {
        console.error("Extraction Failed:", e);
    }
}

extractBook();
