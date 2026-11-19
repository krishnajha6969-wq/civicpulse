const http = require('http');

http.get('http://localhost:3001', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const checks = [
      'CivicPulse',
      'AI-ASSISTED URBAN ISSUE PRIORITISATION &amp; RESOURCE ALLOCATION',
      'A better city starts',
      'with the right priorities.',
      'CivicPulse is being built to connect citizen reports, ward teams and central oversight',
      'Report an issue',
      'Explore ward performance',
      'Roads',
      'Water',
      'Waste',
      'Streetlights',
      'One platform. Three connected portals.',
      'Citizen portal',
      'Ward operations',
      'Central administration',
      'From a report to the right response.',
      'The planned workflow connects reporting, review, ward action and evidence-backed resolution.',
      'Report and receive a ticket',
      'Review and prioritise',
      'Assign and coordinate',
      'Verify and update',
      'Better decisions behind every response.',
      'Capabilities planned for the connected CivicPulse workflow.',
      'Explainable priorities',
      'Related reports, one issue',
      'Resource coordination',
      'Ward accountability',
      'Concept preview',
      'Better decisions.',
      'Stronger neighbourhoods.',
      'A connected approach to reporting local issues, coordinating action and making progress visible.',
      'Track your ticket',
      'An academic prototype for Mira Bhayandar. Not an official MBMC service.',
      'How it works',
      'Ward performance',
      'Citizen sign in'
    ];

    console.log('--- VERIFICATION CHECKS ---');
    let passed = 0;
    for (const c of checks) {
      const ok = body.includes(c);
      console.log((ok ? '✓ PASS: ' : '✗ FAIL: ') + c.substring(0, 50));
      if (ok) passed++;
    }
    console.log('Passed: ' + passed + '/' + checks.length);
  });
}).on('error', err => console.error(err));
