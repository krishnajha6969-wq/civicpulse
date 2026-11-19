const sharp = require('sharp');

async function cleanAuthBgs() {
  const skyCitizenSvg = Buffer.from(`
    <svg width="850" height="460">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#08101e" stop-opacity="1"/>
          <stop offset="78%" stop-color="#091322" stop-opacity="1"/>
          <stop offset="88%" stop-color="#0a1728" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#0a1728" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="850" height="460" fill="url(#skyGrad)"/>
    </svg>
  `);

  await sharp('public/images/auth-citizen-bg.png')
    .composite([{ input: skyCitizenSvg, top: 0, left: 0 }])
    .png()
    .toFile('public/images/auth-citizen-clean.png');

  const skyAdminSvg = Buffer.from(`
    <svg width="850" height="460">
      <defs>
        <linearGradient id="skyGradAdmin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#08101e" stop-opacity="1"/>
          <stop offset="78%" stop-color="#091322" stop-opacity="1"/>
          <stop offset="88%" stop-color="#0b182a" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#0b182a" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="850" height="460" fill="url(#skyGradAdmin)"/>
    </svg>
  `);

  await sharp('public/images/auth-admin-bg.png')
    .composite([{ input: skyAdminSvg, top: 0, left: 0 }])
    .png()
    .toFile('public/images/auth-admin-clean.png');

  console.log('Clean auth backgrounds created without patch');
}

cleanAuthBgs().catch(console.error);
