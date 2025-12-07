const axios = require('axios');

// Backend URL from frontend .env
const BACKEND_URL = 'https://auth-fix-75.preview.emergentagent.com';

// Test data
const testUser = {
  username: 'socialvibe_tester',
  email: 'socialvibe.test@example.com',
  password: 'SecurePass123!'
};

let accessToken = null;

// Helper function to make requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      data: error.response?.data || null,
      error: error.message,
      headers: error.response?.headers || {}
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n=== Testing Health Check Endpoint ===');
  const result = await makeRequest('GET', '/api/health');
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (result.success && result.status === 200) {
    const expectedResponse = { status: 'ok', message: 'Server is running' };
    if (JSON.stringify(result.data) === JSON.stringify(expectedResponse)) {
      console.log('✅ Health check passed - correct response format');
      return true;
    } else {
      console.log('❌ Health check failed - incorrect response format');
      console.log('Expected:', expectedResponse);
      console.log('Received:', result.data);
      return false;
    }
  } else {
    console.log('❌ Health check failed - incorrect status code or request failed');
    if (!result.success) {
      console.log('Error:', result.error);
    }
    return false;
  }
}

// Test 2: User Signup
async function testUserSignup() {
  console.log('\n=== Testing User Signup Endpoint ===');
  const result = await makeRequest('POST', '/api/auth/signup', testUser);
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (result.success && result.status === 201) {
    if (result.data.access_token && result.data.token_type === 'bearer') {
      console.log('✅ Signup passed - received access token');
      accessToken = result.data.access_token;
      return true;
    } else {
      console.log('❌ Signup failed - missing access_token or incorrect token_type');
      return false;
    }
  } else {
    console.log('❌ Signup failed - incorrect status code or request failed');
    if (!result.success) {
      console.log('Error:', result.error);
    }
    return false;
  }
}

// Test 3: User Login
async function testUserLogin() {
  console.log('\n=== Testing User Login Endpoint ===');
  const loginData = {
    username: testUser.username,
    password: testUser.password
  };
  
  const result = await makeRequest('POST', '/api/auth/login', loginData);
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (result.success && result.status === 200) {
    if (result.data.access_token && result.data.token_type === 'bearer') {
      console.log('✅ Login passed - received access token');
      // Update access token for subsequent tests
      accessToken = result.data.access_token;
      return true;
    } else {
      console.log('❌ Login failed - missing access_token or incorrect token_type');
      return false;
    }
  } else {
    console.log('❌ Login failed - incorrect status code or request failed');
    if (!result.success) {
      console.log('Error:', result.error);
    }
    return false;
  }
}

// Test 4: Get Current User
async function testGetCurrentUser() {
  console.log('\n=== Testing Get Current User Endpoint ===');
  
  if (!accessToken) {
    console.log('❌ Cannot test /me endpoint - no access token available');
    return false;
  }
  
  const result = await makeRequest('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${accessToken}`
  });
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (result.success && result.status === 200) {
    const userData = result.data;
    if (userData.id && userData.username && userData.email) {
      console.log('✅ Get current user passed - received user data');
      console.log(`User ID: ${userData.id}`);
      console.log(`Username: ${userData.username}`);
      console.log(`Email: ${userData.email}`);
      return true;
    } else {
      console.log('❌ Get current user failed - missing required user fields');
      return false;
    }
  } else {
    console.log('❌ Get current user failed - incorrect status code or request failed');
    if (!result.success) {
      console.log('Error:', result.error);
    }
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting SocialVibe Authentication Endpoint Tests');
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  const results = {
    healthCheck: false,
    signup: false,
    login: false,
    getCurrentUser: false
  };
  
  try {
    // Test 1: Health Check
    results.healthCheck = await testHealthCheck();
    
    // Test 2: User Signup
    results.signup = await testUserSignup();
    
    // Test 3: User Login (only if signup failed, to test with existing user)
    if (!results.signup) {
      console.log('\n⚠️ Signup failed, attempting login with existing user...');
    }
    results.login = await testUserLogin();
    
    // Test 4: Get Current User (requires valid token)
    results.getCurrentUser = await testGetCurrentUser();
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Health Check: ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Signup: ${results.signup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Login: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Current User: ${results.getCurrentUser ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testHealthCheck, testUserSignup, testUserLogin, testGetCurrentUser };