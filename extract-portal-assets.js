const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function extractAssets() {
  const src = 'C:/Users/Dell/.gemini/antigravity-ide/brain/32732c3b-43a2-475b-a74e-a53b615c2b6c/.user_uploaded/media_1791924248191.jpg';
  const outDir = path.join(__dirname, 'public/images/portals');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1024 x 682
  // Card 1 (Citizen): x ≈ 75 to 359 (width ≈ 284), y ≈ 160 to 560
  // Illustration area: inside the card, approx:
  // Card 1 ill: left 85, top 170, width 264, height 155
  // Card 2 ill: left 380, top 170, width 264, height 155
  // Card 3 ill: left 675, top 170, width 264, height 155

  // Let's do exact crops
  await sharp(src)
    .extract({ left: 80, top: 165, width: 270, height: 160 })
    .toFile(path.join(outDir, 'card-citizen-ill.jpg'));

  await sharp(src)
    .extract({ left: 377, top: 165, width: 270, height: 160 })
    .toFile(path.join(outDir, 'card-ward-ill.jpg'));

  await sharp(src)
    .extract({ left: 674, top: 165, width: 270, height: 160 })
    .toFile(path.join(outDir, 'card-admin-ill.jpg'));

  // Also full card crops for reference
  await sharp(src)
    .extract({ left: 74, top: 156, width: 286, height: 405 })
    .toFile(path.join(outDir, 'full-card-citizen.jpg'));

  await sharp(src)
    .extract({ left: 369, top: 156, width: 286, height: 405 })
    .toFile(path.join(outDir, 'full-card-ward.jpg'));

  await sharp(src)
    .extract({ left: 664, top: 156, width: 286, height: 405 })
    .toFile(path.join(outDir, 'full-card-admin.jpg'));

  // And the bottom panel
  await sharp(src)
    .extract({ left: 60, top: 580, width: 904, height: 80 })
    .toFile(path.join(outDir, 'bottom-banner.jpg'));

  console.log('Assets extracted successfully!');
}

extractAssets().catch(console.error);
