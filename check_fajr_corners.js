const Jimp = require('jimp');

Jimp.read('fajr_extracted_1.png').then(image => {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  const corners = [
    {x: 0, y: 0},
    {x: w-1, y: 0},
    {x: 0, y: h-1},
    {x: w-1, y: h-1},
  ];
  
  console.log(`Dimensions: ${w}x${h}`);
  corners.forEach((c, i) => {
    const hex = image.getPixelColor(c.x, c.y).toString(16).padStart(8, '0');
    console.log(`Corner ${i}: ${hex}`);
  });
}).catch(console.error);
