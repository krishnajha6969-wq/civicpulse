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

async function runStage3Verification() {
  console.log('=== STAGE 3 AUTHENTICATION INTERFACES VERIFICATION ===\n');
  let allPassed = true;

  // 1. Check Login Page
  try {
    const login = await fetchUrl('http://localhost:3001/auth/login');
    console.log(`[GET /auth/login] Status: ${login.status}`);
    const loginChecks = [
      'Welcome back',
      'Continue with Google',
      'Email address',
      'Password',
      'Log In &amp; Continue',
      'Super Admin Sign In',
      'Back to home',
      'CITIZEN PORTAL',
      'Your voice.',
      'A better neighbourhood.'
    ];
    for (const c of loginChecks) {
      const ok = login.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: contains "${c}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/login:', err.message);
    allPassed = false;
  }

  // 2. Check Register Page
  try {
    const reg = await fetchUrl('http://localhost:3001/auth/register');
    console.log(`\n[GET /auth/register] Status: ${reg.status}`);
    const regChecks = [
      'Create your account',
      'Continue with Google',
      'Full name',
      'Email address',
      'Confirm password',
      'Create Account',
      'Terms of Use',
      'Back to home',
      'CITIZEN PORTAL'
    ];
    for (const c of regChecks) {
      const ok = reg.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: contains "${c}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/register:', err.message);
    allPassed = false;
  }

  // 3. Check Super Admin Page
  try {
    const admin = await fetchUrl('http://localhost:3001/auth/admin');
    console.log(`\n[GET /auth/admin] Status: ${admin.status}`);
    const adminChecks = [
      'Super Admin Sign In',
      'Use the account provided by your administrator',
      'Work email',
      'Password',
      'Sign In',
      'Citizen login',
      'Back to home',
      'STAFF PORTAL',
      'Clear priorities.',
      'Coordinated action.'
    ];
    for (const c of adminChecks) {
      const ok = admin.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: contains "${c}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /auth/admin:', err.message);
    allPassed = false;
  }

  // 4. Check Home Page
  try {
    const home = await fetchUrl('http://localhost:3001/');
    console.log(`\n[GET /] Status: ${home.status}`);
    const homeChecks = [
      'CivicPulse',
      'Report an issue',
      'How it works',
      'Decisions',
      'Better decisions.',
      'Stronger neighbourhoods.'
    ];
    for (const c of homeChecks) {
      const ok = home.html.includes(c);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: contains "${c}"`);
      if (!ok) allPassed = false;
    }

    // Also check AuthChoiceModal source directly
    const fs = require('fs');
    const modalSrc = fs.readFileSync('src/components/auth/AuthChoiceModal.tsx', 'utf8');
    const modalChecks = [
      'Already have an account? Continue here.',
      'New to CivicPulse? Register to get started.',
      'Super Admin Sign In',
      'Back to home'
    ];
    console.log('\n[AuthChoiceModal Component Checks]');
    for (const mc of modalChecks) {
      const ok = modalSrc.includes(mc);
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: modal includes "${mc}"`);
      if (!ok) allPassed = false;
    }
  } catch (err) {
    console.error('Error fetching /:', err.message);
    allPassed = false;
  }

  console.log('\n======================================================');
  if (allPassed) {
    console.log('>>> ALL STAGE 3 AUTHENTICATION TESTS PASSED! <<<');
  } else {
    console.log('>>> SOME TESTS FAILED <<<');
  }
}

runStage3Verification();
