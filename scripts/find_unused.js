const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
const unusedFiles = [];

allFiles.forEach(file => {
    const fileName = path.basename(file, path.extname(file));
    if (fileName === 'index' || fileName === 'App') return; // Skip entry points

    let isUsed = false;

    // Naive check: does the filename appear in any other file's content?
    for (const otherFile of allFiles) {
        if (file === otherFile) continue;
        const content = fs.readFileSync(otherFile, 'utf8');

        // Check for import/require with the filename
        // Match: from '../path/FileName' or require('./FileName')
        const regex = new RegExp(`['"/]${fileName}['"]`, 'i');
        if (regex.test(content)) {
            isUsed = true;
            break;
        }
    }

    if (!isUsed) {
        unusedFiles.push(file);
    }
});

console.log('Unused Files:');
unusedFiles.forEach(f => console.log(path.relative(process.cwd(), f)));
