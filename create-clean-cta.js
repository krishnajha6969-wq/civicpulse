const sharp = require('sharp');
const fs = require('fs');

async function makeCleanCtaBg() {
  const width = 1586;
  const height = 500;
  
  // Resize roads sample to cover the right side (950x500)
  const roads = await sharp('public/images/cta-roads-sample.png')
    .resize(950, 500, { fit: 'cover' })
    .toBuffer();

  // Create SVG mask for smooth fade-in from left to right
  const maskSvg = Buffer.from(
    `<svg width="950" height="500">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="white" stop-opacity="0"/>
          <stop offset="20%" stop-color="white" stop-opacity="0.3"/>
          <stop offset="50%" stop-color="white" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="white" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="950" height="500" fill="url(#fade)"/>
    </svg>`
  );

  // Apply mask to roads
  const maskedRoads = await sharp(roads)
    .ensureAlpha()
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Base navy background (1586x500) matching design palette
  const baseSvg = Buffer.from(
    `<svg width="1586" height="500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#081220"/>
          <stop offset="50%" stop-color="#091424"/>
          <stop offset="100%" stop-color="#0c1a2e"/>
        </linearGradient>
      </defs>
      <rect width="1586" height="500" fill="url(#bg)"/>
    </svg>`
  );

  await sharp(baseSvg)
    .composite([
      { input: maskedRoads, left: 1586 - 950, top: 0, blend: 'over' }
    ])
    .png()
    .toFile('public/images/cta-background-clean.png');

  console.log('Clean CTA background generated successfully!');
}

makeCleanCtaBg().catch(console.error);
