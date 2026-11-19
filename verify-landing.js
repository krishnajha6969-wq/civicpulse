const http = require('http');

http.get('http://localhost:3001', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const checks = [
      'CivicPulse',
      'A better city starts',
      'with the right priorities.',
      'Roads',
      'Water',
      'Waste',
      'Streetlights',
      'One city. Multiple sources. Clear priorities.',
      'Citizen reports',
      'Staff submissions',
      'Authorised imports',
      'From a report to the right response.',
      'Collect reports',
      'Assess priority',
      'Recommend resources',
      'Track resolution',
      'Better decisions behind every response.',
      'Explainable priorities',
      'Grouped reports',
      'Recurring hotspots',
      'Resource planning',
      'Illustrative example',
      'Better decisions.',
      'Stronger neighbourhoods.',
      'CITIZEN SERVICES',
      'PLATFORM',
      '© 2026 CivicPulse.'
    ];

    console.log('--- HTML Section Verification ---');
    let allPassed = true;
    for (const c of checks) {
      const found = data.includes(c);
      console.log(`${found ? 'PASS' : 'FAIL'}: "${c}"`);
      if (!found) allPassed = false;
    }

    const regex = /From a report to the right response/g;
    const matches = data.match(regex) || [];
    console.log(`\nOccurrences of 'From a report to the right response': ${matches.length} (Expected: exactly 1)`);

    if (allPassed && matches.length === 1) {
      console.log('\n>>> ALL STAGE 2 CHECKS PASSED SUCCESSFULLY! <<<');
    }
  });
}).on('error', (err) => {
  console.error('Error connecting to server:', err);
});
