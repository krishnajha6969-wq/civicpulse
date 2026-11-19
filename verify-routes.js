const http = require('http');

const routes = [
  { path: '/', expected: ['CivicPulse', 'AI-ASSISTED URBAN ISSUE PRIORITISATION'] },
  { path: '/auth/login', expected: ['Welcome back', 'Sign in', 'Continue with Google'] },
  { path: '/auth/register', expected: ['Create your account', 'Continue with Google', 'Full name'] },
  { path: '/auth/admin', expected: ['CENTRAL ADMINISTRATION', 'Super Admin sign in', 'Restricted access for authorised central administration'] },
  { path: '/citizen', expected: ['Authentication Required', 'Citizen Sign In'] },
  { path: '/admin', expected: ['Authentication Required', 'Super Admin Sign In'] },
];

async function testRoutes() {
  console.log('--- ROUTE INTEGRATION CHECKS ---');
  for (const r of routes) {
    await new Promise((resolve) => {
      http.get('http://localhost:3001' + r.path, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          let allMatch = true;
          for (const exp of r.expected) {
            if (!body.includes(exp)) {
              console.log(`✗ ${r.path}: Missing "${exp}"`);
              allMatch = false;
            }
          }
          if (allMatch) {
            console.log(`✓ ${r.path}: OK (${res.statusCode})`);
          }
          resolve();
        });
      }).on('error', err => {
        console.error(`Error on ${r.path}:`, err.message);
        resolve();
      });
    });
  }
}

testRoutes();
