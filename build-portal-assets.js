const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function build() {
  const src = 'C:/Users/Dell/.gemini/antigravity-ide/brain/32732c3b-43a2-475b-a74e-a53b615c2b6c/.user_uploaded/media_1791924248191.jpg';
  const outDir = path.join(__dirname, 'public/images/portals');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Precise illustration crops
  await sharp(src)
    .extract({ left: 74, top: 156, width: 286, height: 170 })
    .toFile(path.join(outDir, 'citizen-card-head.jpg'));

  await sharp(src)
    .extract({ left: 369, top: 156, width: 286, height: 170 })
    .toFile(path.join(outDir, 'ward-card-head.jpg'));

  await sharp(src)
    .extract({ left: 664, top: 156, width: 286, height: 170 })
    .toFile(path.join(outDir, 'admin-card-head.jpg'));

  // 2. Target icon from bottom banner
  await sharp(src)
    .extract({ left: 76, top: 590, width: 56, height: 56 })
    .toFile(path.join(outDir, 'bottom-target-icon.jpg'));

  // 3. Crisp aerial city background with subtle vignette for edge contrast
  const vignetteSvg = Buffer.from(
    '<svg width="1024" height="682" xmlns="http://www.w3.org/2000/svg">' +
    '  <defs>' +
    '    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">' +
    '      <stop offset="0%" stop-color="#040a16" stop-opacity="0.35" />' +
    '      <stop offset="65%" stop-color="#040a16" stop-opacity="0.45" />' +
    '      <stop offset="100%" stop-color="#01040a" stop-opacity="0.80" />' +
    '    </radialGradient>' +
    '  </defs>' +
    '  <rect width="1024" height="682" fill="url(#vignette)" />' +
    '</svg>'
  );

  await sharp(src)
    .composite([{ input: vignetteSvg, blend: 'over' }])
    .toFile(path.join(outDir, 'portal-city-bg.jpg'));

  console.log('Successfully built portal assets!');
}

build().catch(console.error);
