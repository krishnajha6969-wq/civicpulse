const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log('CIVICPULSE — CITIZEN PORTAL DASHBOARD VERIFICATION');
  console.log('====================================================\n');

  let passed = true;

  // 1. Check /citizen route
  try {
    const res = await fetchUrl('http://localhost:3001/citizen');
    console.log('[GET /citizen] HTTP Status:', res.status);
    const checks = [
      'CivicPulse',
      'CITIZEN PORTAL',
      'Dashboard',
      'Report an Issue',
      'My Reports',
      'Notifications',
      'Community',
      'Help &amp; Support',
      'A cleaner neighbourhood starts with you',
      'Report. Track. See change.',
      'Reports Around You',
      'Live view of reported issues in your area',
      'Report a new issue',
      'Spotted a problem in your area? Help us fix it.',
      'Recent Updates',
      'Your Recent Reports',
      'Total Reports',
      'In Progress',
      'Resolved',
      'Awaiting Update',
    ];
    for (const c of checks) {
      const ok = res.data.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: Contains "${c}"`);
      if (!ok) passed = false;
    }
  } catch (err) {
    console.error('Error fetching /citizen:', err.message);
    passed = false;
  }

  // 2. Check /auth/login
  try {
    const res = await fetchUrl('http://localhost:3001/auth/login');
    console.log('\n[GET /auth/login] HTTP Status:', res.status);
    const checks = [
      'CITIZEN PORTAL',
      'Sign in to your account',
      'Create account',
      'Email address',
      'Password',
    ];
    for (const c of checks) {
      const ok = res.data.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: Contains "${c}"`);
      if (!ok) passed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/login:', err.message);
    passed = false;
  }

  // 3. Check /auth/register
  try {
    const res = await fetchUrl('http://localhost:3001/auth/register');
    console.log('\n[GET /auth/register] HTTP Status:', res.status);
    const checks = [
      'CITIZEN PORTAL',
      'Create your account',
      'Full name',
      'Email address',
      'Password',
      'Confirm password',
    ];
    for (const c of checks) {
      const ok = res.data.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: Contains "${c}"`);
      if (!ok) passed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/register:', err.message);
    passed = false;
  }

  console.log('\n====================================================');
  console.log('OVERALL RESULT:', passed ? 'ALL CHECKS PASSED ✓' : 'SOME CHECKS FAILED ✗');
  console.log('====================================================');
  process.exit(passed ? 0 : 1);
}

runVerification();
