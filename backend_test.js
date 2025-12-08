const axios = require('axios');

// Backend URL from frontend .env
const BACKEND_URL = 'https://auth-system-check-4.preview.emergentagent.com';

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

// Test 2b: Duplicate Username Registration
async function testDuplicateUsernameSignup() {
  console.log('\n=== Testing Duplicate Username Registration ===');
  const duplicateUser = {
    username: testUser.username, // Same username
    email: 'different.email@example.com', // Different email
    password: 'DifferentPass123!'
  };
  
  const result = await makeRequest('POST', '/api/auth/signup', duplicateUser);
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (!result.success && result.status === 400) {
    if (result.data && result.data.detail === 'Username already registered') {
      console.log('✅ Duplicate username test passed - correct error message');
      return true;
    } else {
      console.log('❌ Duplicate username test failed - incorrect error message');
      console.log('Expected: "Username already registered"');
      console.log('Received:', result.data?.detail);
      return false;
    }
  } else {
    console.log('❌ Duplicate username test failed - should return 400 status');
    return false;
  }
}

// Test 2c: Duplicate Email Registration
async function testDuplicateEmailSignup() {
  console.log('\n=== Testing Duplicate Email Registration ===');
  const duplicateUser = {
    username: 'different_username', // Different username
    email: testUser.email, // Same email
    password: 'DifferentPass123!'
  };
  
  const result = await makeRequest('POST', '/api/auth/signup', duplicateUser);
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (!result.success && result.status === 400) {
    if (result.data && result.data.detail === 'Email already registered') {
      console.log('✅ Duplicate email test passed - correct error message');
      return true;
    } else {
      console.log('❌ Duplicate email test failed - incorrect error message');
      console.log('Expected: "Email already registered"');
      console.log('Received:', result.data?.detail);
      return false;
    }
  } else {
    console.log('❌ Duplicate email test failed - should return 400 status');
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

// Test 3b: Invalid Password Login
async function testInvalidPasswordLogin() {
  console.log('\n=== Testing Invalid Password Login ===');
  const loginData = {
    username: testUser.username,
    password: 'WrongPassword123!'
  };
  
  const result = await makeRequest('POST', '/api/auth/login', loginData);
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (!result.success && result.status === 401) {
    if (result.data && result.data.detail === 'Invalid username or password') {
      console.log('✅ Invalid password test passed - correct error message');
      return true;
    } else {
      console.log('❌ Invalid password test failed - incorrect error message');
      console.log('Expected: "Invalid username or password"');
      console.log('Received:', result.data?.detail);
      return false;
    }
  } else {
    console.log('❌ Invalid password test failed - should return 401 status');
    return false;
  }
}

// Test 3c: Non-existent User Login
async function testNonExistentUserLogin() {
  console.log('\n=== Testing Non-existent User Login ===');
  const loginData = {
    username: 'nonexistent_user_12345',
    password: 'SomePassword123!'
  };
  
  const result = await makeRequest('POST', '/api/auth/login', loginData);
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (!result.success && result.status === 401) {
    if (result.data && result.data.detail === 'Invalid username or password') {
      console.log('✅ Non-existent user test passed - correct error message');
      return true;
    } else {
      console.log('❌ Non-existent user test failed - incorrect error message');
      console.log('Expected: "Invalid username or password"');
      console.log('Received:', result.data?.detail);
      return false;
    }
  } else {
    console.log('❌ Non-existent user test failed - should return 401 status');
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
      console.log(`Bio: ${userData.bio}`);
      console.log(`Avatar: ${userData.avatar}`);
      console.log(`Followers: ${userData.followers_count}`);
      console.log(`Following: ${userData.following_count}`);
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

// Test 4b: Invalid Token Test
async function testInvalidToken() {
  console.log('\n=== Testing Invalid Token Access ===');
  
  const result = await makeRequest('GET', '/api/auth/me', null, {
    'Authorization': 'Bearer invalid_token_12345'
  });
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (!result.success && result.status === 401) {
    console.log('✅ Invalid token test passed - correctly rejected');
    return true;
  } else {
    console.log('❌ Invalid token test failed - should return 401 status');
    return false;
  }
}

// Test 4c: No Token Test
async function testNoToken() {
  console.log('\n=== Testing No Token Access ===');
  
  const result = await makeRequest('GET', '/api/auth/me');
  
  console.log(`Status: ${result.status}`);
  console.log(`Response:`, result.data);
  
  if (!result.success && result.status === 401) {
    console.log('✅ No token test passed - correctly rejected');
    return true;
  } else {
    console.log('❌ No token test failed - should return 401 status');
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
    duplicateUsername: false,
    duplicateEmail: false,
    login: false,
    invalidPassword: false,
    nonExistentUser: false,
    getCurrentUser: false,
    invalidToken: false,
    noToken: false
  };
  
  try {
    // Test 1: Health Check
    results.healthCheck = await testHealthCheck();
    
    // Test 2: User Signup
    results.signup = await testUserSignup();
    
    // Test 2b & 2c: Duplicate Registration Tests (only if signup succeeded)
    if (results.signup) {
      results.duplicateUsername = await testDuplicateUsernameSignup();
      results.duplicateEmail = await testDuplicateEmailSignup();
    } else {
      console.log('\n⚠️ Skipping duplicate tests - initial signup failed');
    }
    
    // Test 3: User Login (try regardless of signup result)
    results.login = await testUserLogin();
    
    // Test 3b & 3c: Invalid Login Tests (only if we have a valid user)
    if (results.signup || results.login) {
      results.invalidPassword = await testInvalidPasswordLogin();
      results.nonExistentUser = await testNonExistentUserLogin();
    } else {
      console.log('\n⚠️ Skipping invalid login tests - no valid user available');
    }
    
    // Test 4: Get Current User (requires valid token)
    results.getCurrentUser = await testGetCurrentUser();
    
    // Test 4b & 4c: Invalid Token Tests
    results.invalidToken = await testInvalidToken();
    results.noToken = await testNoToken();
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
  
  // Summary
  console.log('\n=== COMPREHENSIVE TEST SUMMARY ===');
  console.log(`Health Check: ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Signup: ${results.signup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Duplicate Username: ${results.duplicateUsername ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Duplicate Email: ${results.duplicateEmail ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Login: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Invalid Password: ${results.invalidPassword ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Non-existent User: ${results.nonExistentUser ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Current User: ${results.getCurrentUser ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Invalid Token: ${results.invalidToken ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`No Token: ${results.noToken ? '✅ PASS' : '❌ FAIL'}`);
  
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