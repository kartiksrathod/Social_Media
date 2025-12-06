#!/usr/bin/env python3
"""
SocialVibe Backend API Testing Script
Tests all core authentication and user profile endpoints
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    return 'http://localhost:8001'

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log_test(test_name, status, details=""):
    timestamp = datetime.now().strftime("%H:%M:%S")
    if status == "PASS":
        print(f"{Colors.GREEN}✅ [{timestamp}] {test_name}: PASS{Colors.ENDC}")
    elif status == "FAIL":
        print(f"{Colors.RED}❌ [{timestamp}] {test_name}: FAIL{Colors.ENDC}")
        if details:
            print(f"   {Colors.RED}Details: {details}{Colors.ENDC}")
    elif status == "INFO":
        print(f"{Colors.BLUE}ℹ️  [{timestamp}] {test_name}{Colors.ENDC}")
        if details:
            print(f"   {details}")
    elif status == "WARN":
        print(f"{Colors.YELLOW}⚠️  [{timestamp}] {test_name}: WARNING{Colors.ENDC}")
        if details:
            print(f"   {Colors.YELLOW}Details: {details}{Colors.ENDC}")

def test_server_health():
    """Test if server is running and accessible"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test("Server Health Check", "PASS", f"Status: {data.get('status', 'unknown')}")
            return True
        else:
            log_test("Server Health Check", "FAIL", f"Status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        log_test("Server Health Check", "FAIL", f"Connection error: {str(e)}")
        return False

def test_user_signup():
    """Test user registration endpoint"""
    test_user = {
        "username": "testuser",
        "email": "test@example.com", 
        "password": "Test123!"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/signup", json=test_user, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            if 'access_token' in data and 'token_type' in data:
                log_test("User Signup", "PASS", f"Token type: {data['token_type']}")
                return data['access_token']
            else:
                log_test("User Signup", "FAIL", "Missing access_token or token_type in response")
                return None
        elif response.status_code == 400:
            error_data = response.json()
            if 'Username already registered' in error_data.get('detail', ''):
                log_test("User Signup", "INFO", "User already exists, will test login instead")
                return "USER_EXISTS"
            else:
                log_test("User Signup", "FAIL", f"Bad request: {error_data.get('detail', 'Unknown error')}")
                return None
        else:
            log_test("User Signup", "FAIL", f"Status code: {response.status_code}, Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("User Signup", "FAIL", f"Request error: {str(e)}")
        return None

def test_user_login():
    """Test user login endpoint"""
    login_data = {
        "username": "testuser",
        "password": "Test123!"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'token_type' in data:
                log_test("User Login", "PASS", f"Token type: {data['token_type']}")
                return data['access_token']
            else:
                log_test("User Login", "FAIL", "Missing access_token or token_type in response")
                return None
        else:
            error_data = response.json()
            log_test("User Login", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("User Login", "FAIL", f"Request error: {str(e)}")
        return None

def test_get_current_user(token):
    """Test getting current user info"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['id', 'username', 'email', 'bio', 'followers_count', 'following_count']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                log_test("Get Current User", "PASS", f"Username: {data['username']}, Email: {data['email']}")
                return data
            else:
                log_test("Get Current User", "FAIL", f"Missing fields: {missing_fields}")
                return None
        else:
            error_data = response.json()
            log_test("Get Current User", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("Get Current User", "FAIL", f"Request error: {str(e)}")
        return None

def test_update_profile(token):
    """Test updating user profile"""
    headers = {"Authorization": f"Bearer {token}"}
    update_data = {
        "name": "Sarah Johnson",
        "bio": "Software engineer passionate about social media and technology. Love connecting with like-minded people!",
        "username": "sarah_johnson"
    }
    
    try:
        response = requests.put(f"{API_BASE}/users/me", json=update_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('name') == update_data['name'] and data.get('bio') == update_data['bio']:
                log_test("Update Profile", "PASS", f"Name: {data['name']}, Bio length: {len(data['bio'])} chars")
                return data
            else:
                log_test("Update Profile", "FAIL", "Profile data not updated correctly")
                return None
        else:
            error_data = response.json()
            log_test("Update Profile", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("Update Profile", "FAIL", f"Request error: {str(e)}")
        return None

def test_get_user_profile(token, username):
    """Test getting user profile by username"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE}/users/{username}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['id', 'username', 'name', 'bio', 'followers_count', 'following_count']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                log_test("Get User Profile", "PASS", f"Username: {data['username']}, Name: {data.get('name', 'N/A')}")
                return data
            else:
                log_test("Get User Profile", "FAIL", f"Missing fields: {missing_fields}")
                return None
        elif response.status_code == 404:
            log_test("Get User Profile", "FAIL", f"User '{username}' not found")
            return None
        else:
            error_data = response.json()
            log_test("Get User Profile", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("Get User Profile", "FAIL", f"Request error: {str(e)}")
        return None

def test_username_validation(token):
    """Test username validation in profile update"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test invalid username (too short)
    invalid_data = {"username": "ab"}
    
    try:
        response = requests.put(f"{API_BASE}/users/me", json=invalid_data, headers=headers, timeout=10)
        
        if response.status_code == 400:
            error_data = response.json()
            if "at least 3 characters" in error_data.get('detail', ''):
                log_test("Username Validation (Too Short)", "PASS", "Correctly rejected short username")
            else:
                log_test("Username Validation (Too Short)", "FAIL", f"Unexpected error: {error_data.get('detail', 'Unknown')}")
        else:
            log_test("Username Validation (Too Short)", "FAIL", f"Expected 400, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        log_test("Username Validation (Too Short)", "FAIL", f"Request error: {str(e)}")

def test_authentication_required():
    """Test that protected endpoints require authentication"""
    try:
        # Test without token
        response = requests.get(f"{API_BASE}/auth/me", timeout=10)
        
        if response.status_code == 401:
            log_test("Authentication Required", "PASS", "Correctly rejected request without token")
        else:
            log_test("Authentication Required", "FAIL", f"Expected 401, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        log_test("Authentication Required", "FAIL", f"Request error: {str(e)}")

def test_image_upload(token):
    """Test image upload endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a simple test image (1x1 pixel PNG)
    import base64
    import io
    
    # Minimal PNG data (1x1 transparent pixel)
    png_data = base64.b64decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8'
        'IQAAAAABJRU5ErkJggg=='
    )
    
    try:
        files = {'file': ('test_image.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{API_BASE}/posts/upload-image", headers=headers, files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if 'url' in data and data['url']:
                log_test("Image Upload", "PASS", f"Image URL: {data['url'][:50]}...")
                return data['url']
            else:
                log_test("Image Upload", "FAIL", "Missing URL in response")
                return None
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {'detail': response.text}
            log_test("Image Upload", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("Image Upload", "FAIL", f"Request error: {str(e)}")
        return None

def test_create_post_with_image(token, image_url=None):
    """Test creating a post with image"""
    headers = {"Authorization": f"Bearer {token}"}
    
    post_data = {
        "text": "Just uploaded a beautiful sunset photo! 🌅 #photography #nature #sunset",
        "visibility": "public"
    }
    
    if image_url:
        post_data["images"] = [image_url]
    
    try:
        response = requests.post(f"{API_BASE}/posts", json=post_data, headers=headers, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            required_fields = ['id', 'author_username', 'text', 'created_at']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                images_info = f", Images: {len(data.get('images', []))}" if data.get('images') else ""
                log_test("Create Post with Image", "PASS", f"Post ID: {data['id']}, Text length: {len(data['text'])}{images_info}")
                return data
            else:
                log_test("Create Post with Image", "FAIL", f"Missing fields: {missing_fields}")
                return None
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {'detail': response.text}
            log_test("Create Post with Image", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("Create Post with Image", "FAIL", f"Request error: {str(e)}")
        return None

def test_create_post_text_only(token):
    """Test creating a text-only post"""
    headers = {"Authorization": f"Bearer {token}"}
    
    post_data = {
        "text": "Having a great day coding! 💻 Working on some exciting new features. #coding #developer #tech",
        "visibility": "public"
    }
    
    try:
        response = requests.post(f"{API_BASE}/posts", json=post_data, headers=headers, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            required_fields = ['id', 'author_username', 'text', 'created_at']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                log_test("Create Text Post", "PASS", f"Post ID: {data['id']}, Text length: {len(data['text'])}")
                return data
            else:
                log_test("Create Text Post", "FAIL", f"Missing fields: {missing_fields}")
                return None
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {'detail': response.text}
            log_test("Create Text Post", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("Create Text Post", "FAIL", f"Request error: {str(e)}")
        return None

def create_test_posts(token):
    """Create 2-3 test posts with hashtags as requested"""
    headers = {"Authorization": f"Bearer {token}"}
    
    test_posts = [
        {
            "text": "Just launched my new mobile app! 📱 The user experience is amazing and the interface is so smooth. #test #mobile #ux #app #launch",
            "visibility": "public"
        },
        {
            "text": "Working on some exciting new features for our platform. The mobile optimization is coming along great! #test #mobile #development #features",
            "visibility": "public"
        },
        {
            "text": "Love how intuitive this new UX design is! Mobile-first approach really makes a difference. #test #ux #mobile #design #userexperience",
            "visibility": "public"
        }
    ]
    
    created_posts = []
    
    for i, post_data in enumerate(test_posts, 1):
        try:
            response = requests.post(f"{API_BASE}/posts", json=post_data, headers=headers, timeout=10)
            
            if response.status_code == 201:
                data = response.json()
                log_test(f"Create Test Post {i}", "PASS", f"Post ID: {data['id']}, Hashtags: {len(data.get('hashtags', []))}")
                created_posts.append(data)
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {'detail': response.text}
                log_test(f"Create Test Post {i}", "FAIL", f"Status code: {response.status_code}, Error: {error_data.get('detail', 'Unknown error')}")
                
        except requests.exceptions.RequestException as e:
            log_test(f"Create Test Post {i}", "FAIL", f"Request error: {str(e)}")
    
    return created_posts

def main():
    """Run all backend tests"""
    print(f"{Colors.BOLD}🧪 SocialVibe Backend API Testing{Colors.ENDC}")
    print(f"Testing backend at: {BASE_URL}")
    print("=" * 60)
    
    # Test 1: Server Health
    if not test_server_health():
        print(f"\n{Colors.RED}❌ Server is not accessible. Stopping tests.{Colors.ENDC}")
        return False
    
    # Test 2: Authentication Required
    test_authentication_required()
    
    # Test 3: User Signup
    token = test_user_signup()
    
    # If user already exists, try login
    if token == "USER_EXISTS":
        token = test_user_login()
    
    if not token:
        print(f"\n{Colors.RED}❌ Could not obtain authentication token. Stopping user tests.{Colors.ENDC}")
        return False
    
    # Test 4: Get Current User
    current_user = test_get_current_user(token)
    if not current_user:
        print(f"\n{Colors.RED}❌ Could not get current user info. Stopping profile tests.{Colors.ENDC}")
        return False
    
    username = current_user['username']
    
    # Test 5: Update Profile
    test_update_profile(token)
    
    # Test 6: Get User Profile by Username
    test_get_user_profile(token, username)
    
    # Test 7: Username Validation
    test_username_validation(token)
    
    print(f"\n{Colors.BLUE}📸 Testing Post and Image Upload Features{Colors.ENDC}")
    print("-" * 60)
    
    # Test 8: Image Upload
    image_url = test_image_upload(token)
    
    # Test 9: Create Post with Image
    if image_url:
        test_create_post_with_image(token, image_url)
    else:
        log_test("Create Post with Image", "WARN", "Skipped due to image upload failure")
    
    # Test 10: Create Text-only Post
    test_create_post_text_only(token)
    
    # Test 11: Create Post without Image (fallback test)
    test_create_post_with_image(token, None)
    
    print("\n" + "=" * 60)
    print(f"{Colors.BOLD}🎯 Backend Testing Complete{Colors.ENDC}")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)