const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dirs = ['assets', 'src'];
let hasError = false;

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

console.log(`Checking ${pngs.length} PNGs...`);

pngs.forEach(png => {
    try {
        // Check if it's a valid image by asking sips for properties
        const output = execSync(`sips -g pixelWidth -g pixelHeight -g format "${png}"`).toString();
        if (!output.toLowerCase().includes('png')) {
            console.error(`Error: ${png} is not reported as PNG format by sips.`);
            hasError = true;
        }
        // Check permissions (readable)
        fs.accessSync(png, fs.constants.R_OK);

    } catch (e) {
        console.error(`Invalid PNG: ${png}`, e.message);
        hasError = true;
    }
});

if (hasError) {
    console.error("PNG validation failed.");
    process.exit(1);
} else {
    console.log("All PNGs verified.");
}
