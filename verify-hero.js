const http = require('http');
http.get('http://localhost:3001', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const checks = {
      'cityArtBg div': data.includes('cityArtBg'),
      'Hero heading part 1': data.includes('A better city starts'),
      'Hero heading part 2': data.includes('right priorities'),
      'Report an issue btn': data.includes('Report an issue'),
      'Explore public insights btn': data.includes('Explore public insights'),
      'Super Admin Sign In': data.includes('Super Admin Sign In'),
      'Roads': data.includes('Roads'),
      'Water': data.includes('Water'),
    };
    Object.entries(checks).forEach(([k, v]) => {
      console.log((v ? 'PASS' : 'FAIL') + ': ' + k);
    });
  });
}).on('error', e => console.error('Server not reachable:', e.message));
