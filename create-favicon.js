const sharp = require('sharp');
const fs = require('fs');

async function createFavicons() {
  // SVG definition of CivicPulse pulse logo on dark navy rounded tile
  const svgBuffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" rx="16" fill="#0b1526" />
      <polyline
        points="10 32 20 32 26 14 38 50 44 32 54 32"
        fill="none"
        stroke="#5cebaa"
        stroke-width="5.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `);

  // Write SVG favicon
  fs.writeFileSync('public/favicon.svg', svgBuffer);
  fs.writeFileSync('src/app/icon.svg', svgBuffer);
  console.log('Created public/favicon.svg and src/app/icon.svg');

  // Generate PNG icons
  // Next.js App Router automatically uses src/app/icon.png if present
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('src/app/icon.png');
  console.log('Created src/app/icon.png (32x32)');

  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-32x32.png');

  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-icon.png');

  // Also create a 48x48 / 32x32 ICO file in public/favicon.ico
  await sharp(svgBuffer)
    .resize(48, 48)
    .toFormat('png')
    .toFile('public/favicon.ico');
  console.log('Created public/favicon.ico and apple-icon.png');
}

createFavicons().catch(console.error);
