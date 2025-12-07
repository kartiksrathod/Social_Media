const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8001,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

console.log('Testing connection to backend...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.setTimeout(5000);
req.end();