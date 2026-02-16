const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dirs = ['assets', 'src'];

function findPngs(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findPngs(filePath, fileList);
        } else if (file.toLowerCase().endsWith('.png')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const pngs = dirs.reduce((acc, dir) => findPngs(dir, acc), []);

console.log(`Found ${pngs.length} PNGs to normalize...`);

pngs.forEach(png => {
    try {
        // 1. Force PNG format (re-encoding) which fixes many internal structure issues
        // 2. Delete all properties (strip metadata/ICC profiles which confuse AAPT2)
        console.log(`Normalizing: ${png}`);
        execSync(`sips -s format png "${png}" --out "${png}"`, { stdio: 'inherit' });
        // Strip metadata
        try {
            execSync(`sips -d profile --deleteProperty all "${png}"`, { stdio: 'ignore' });
        } catch (err) {
            // Some properties might not exist, that's fine
        }
    } catch (e) {
        console.error(`Failed to normalize ${png}:`, e.message);
        process.exit(1);
    }
});

console.log('All PNGs normalized.');
