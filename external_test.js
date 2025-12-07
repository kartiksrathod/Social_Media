const https = require('https');

function makeHttpsRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SocialVibe-Test/1.0',
        ...headers
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            success: true,
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            success: true,
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject({
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout'
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testExternalBackend() {
  const baseUrl = 'https://auth-fix-75.preview.emergentagent.com';
  
  console.log('Testing external backend URL:', baseUrl);
  
  // Test 1: Health Check
  console.log('\n=== Testing Health Check ===');
  try {
    const result = await makeHttpsRequest(`${baseUrl}/api/health`);
    console.log('✅ Health check successful');
    console.log('Status:', result.status);
    console.log('Response:', result.data);
  } catch (error) {
    console.log('❌ Health check failed');
    console.log('Error:', error.error || error.message);
  }
  
  // Test 2: Signup
  console.log('\n=== Testing Signup ===');
  const testUser = {
    username: 'socialvibe_tester',
    email: 'socialvibe.test@example.com',
    password: 'SecurePass123!'
  };
  
  try {
    const result = await makeHttpsRequest(`${baseUrl}/api/auth/signup`, 'POST', testUser);
    console.log('✅ Signup successful');
    console.log('Status:', result.status);
    console.log('Response:', result.data);
    
    if (result.data && result.data.access_token) {
      console.log('Access token received:', result.data.access_token.substring(0, 20) + '...');
      
      // Test 3: Get current user
      console.log('\n=== Testing Get Current User ===');
      try {
        const userResult = await makeHttpsRequest(`${baseUrl}/api/auth/me`, 'GET', null, {
          'Authorization': `Bearer ${result.data.access_token}`
        });
        console.log('✅ Get current user successful');
        console.log('Status:', userResult.status);
        console.log('User data:', userResult.data);
      } catch (userError) {
        console.log('❌ Get current user failed');
        console.log('Error:', userError.error || userError.message);
      }
    }
  } catch (error) {
    console.log('❌ Signup failed');
    console.log('Error:', error.error || error.message);
    
    // If signup failed, try login
    console.log('\n=== Testing Login (fallback) ===');
    try {
      const loginResult = await makeHttpsRequest(`${baseUrl}/api/auth/login`, 'POST', {
        username: testUser.username,
        password: testUser.password
      });
      console.log('✅ Login successful');
      console.log('Status:', loginResult.status);
      console.log('Response:', loginResult.data);
    } catch (loginError) {
      console.log('❌ Login failed');
      console.log('Error:', loginError.error || loginError.message);
    }
  }
}

testExternalBackend().catch(console.error);