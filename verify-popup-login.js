const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('=== VERIFYING PUBLIC INSIGHTS & TRACK REPORT LOGIN-FIRST POPUP FLOW ===\n');
  let allPassed = true;

  // 1. Verify Home Page loads and includes both buttons
  try {
    const home = await fetchUrl('http://localhost:3001/');
    console.log(`[GET /] Status: ${home.status}`);
    const checks = [
      'CivicPulse',
      'Public insights',
      'Track report',
      'Explore public insights',
      'Track your report',
      'Report an issue',
    ];
    for (const c of checks) {
      const ok = home.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: Contains "${c}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /:', err.message);
    allPassed = false;
  }

  // 2. Verify /auth/login with destination=insights
  try {
    const loginInsights = await fetchUrl('http://localhost:3001/auth/login?destination=insights');
    console.log(`\n[GET /auth/login?destination=insights] Status: ${loginInsights.status}`);
    const checks = [
      'Please log in first to access Public Insights',
      'CITIZEN PORTAL',
      'Email address',
      'Password'
    ];
    for (const c of checks) {
      const ok = loginInsights.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: Contains "${c}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/login?destination=insights:', err.message);
    allPassed = false;
  }

  // 3. Verify /auth/login with destination=track
  try {
    const loginTrack = await fetchUrl('http://localhost:3001/auth/login?destination=track');
    console.log(`\n[GET /auth/login?destination=track] Status: ${loginTrack.status}`);
    const checks = [
      'Please log in first to track your report',
      'CITIZEN PORTAL',
      'Email address',
      'Password'
    ];
    for (const c of checks) {
      const ok = loginTrack.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: Contains "${c}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/login?destination=track:', err.message);
    allPassed = false;
  }

  // 4. Verify /auth/register with destination=insights
  try {
    const regInsights = await fetchUrl('http://localhost:3001/auth/register?destination=insights');
    console.log(`\n[GET /auth/register?destination=insights] Status: ${regInsights.status}`);
    const checks = [
      'Create an account to access Public Insights',
      'CITIZEN PORTAL',
      'Create your account'
    ];
    for (const c of checks) {
      const ok = regInsights.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: Contains "${c}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/register?destination=insights:', err.message);
    allPassed = false;
  }

  console.log(`\nAll checks passed: ${allPassed ? 'YES' : 'NO'}`);
  process.exit(allPassed ? 0 : 1);
}

verify();
