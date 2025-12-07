const http = require('http');

function testEndpoint(host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(5000);
    req.end();
  });
}

async function runTest() {
  console.log('Testing backend health endpoint...');
  
  try {
    const result = await testEndpoint('127.0.0.1', 8001, '/api/health');
    console.log('✅ Success!');
    console.log('Status Code:', result.statusCode);
    console.log('Response:', result.body);
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.message);
  }
}

runTest();