#!/usr/bin/env python3
"""
Create Sample Posts for Frontend Testing
Creates 4 sample posts with hashtags to enable frontend testing of Quick Wins features.
"""

import requests
import json

# Backend URL from environment
BACKEND_URL = "https://feature-checks.preview.emergentagent.com/api"

class PostCreator:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.user_id = None
        
    def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=data)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            else:
                return False, f"Unsupported method: {method}", None
            
            return True, response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", None
        except json.JSONDecodeError:
            return False, f"Invalid JSON response", response.text if 'response' in locals() else None
    
    def login_or_create_testuser(self):
        """Login as testuser or create if doesn't exist"""
        # Try to login first
        login_data = {
            "username": "testuser",
            "password": "password"
        }
        
        success, status_code, response = self.make_request("POST", "/auth/login", login_data)
        
        if success and status_code == 200 and "access_token" in response:
            self.token = response["access_token"]
            print("✅ Logged in as testuser")
            return True
        
        # If login failed, try to create the user
        signup_data = {
            "username": "testuser",
            "email": "testuser@socialvibe.com",
            "password": "password"
        }
        
        success, status_code, response = self.make_request("POST", "/auth/signup", signup_data)
        
        if success and status_code == 200 and "access_token" in response:
            self.token = response["access_token"]
            print("✅ Created and logged in as testuser")
            return True
        else:
            print(f"❌ Failed to login or create testuser: {status_code} - {response}")
            return False
    
    def get_current_user_info(self):
        """Get current user information"""
        if not self.token:
            return False
        
        success, status_code, response = self.make_request("GET", "/auth/me", token=self.token)
        
        if success and status_code == 200:
            self.user_id = response["id"]
            print(f"✅ User info retrieved: {response['username']} (ID: {self.user_id})")
            return True
        else:
            print(f"❌ Failed to get user info: {status_code} - {response}")
            return False
    
    def create_post(self, text: str, description: str):
        """Create a single post"""
        if not self.token:
            print("❌ No authentication token available")
            return False
        
        data = {
            "text": text,
            "image_url": None
        }
        
        success, status_code, response = self.make_request("POST", "/posts", data, token=self.token)
        
        if success and status_code == 200 and "id" in response:
            hashtags = response.get("hashtags", [])
            print(f"✅ {description}")
            print(f"   Post ID: {response['id']}")
            print(f"   Hashtags extracted: {hashtags}")
            return True, response["id"]
        else:
            print(f"❌ Failed to create {description}: {status_code} - {response}")
            return False, None
    
    def verify_posts_created(self):
        """Verify posts were created by checking feed"""
        success, status_code, response = self.make_request("GET", "/posts/feed", token=self.token)
        
        if success and status_code == 200 and isinstance(response, list):
            print(f"✅ Feed verification: {len(response)} posts in feed")
            return True
        else:
            print(f"❌ Failed to verify posts: {status_code} - {response}")
            return False
    
    def verify_hashtags_trending(self):
        """Verify hashtags were extracted and are trending"""
        success, status_code, response = self.make_request("GET", "/hashtags/trending", token=self.token)
        
        if success and status_code == 200 and isinstance(response, list):
            print(f"✅ Trending hashtags verification: {len(response)} hashtags found")
            for hashtag in response[:5]:  # Show top 5
                print(f"   #{hashtag['tag']} ({hashtag['count']} posts)")
            return True
        else:
            print(f"❌ Failed to verify hashtags: {status_code} - {response}")
            return False
    
    def create_sample_posts(self):
        """Create all 4 sample posts as specified in the request"""
        print("🚀 Creating Sample Posts for Frontend Testing")
        print("=" * 50)
        
        # Step 1: Login or create testuser
        if not self.login_or_create_testuser():
            return False
        
        # Step 2: Get user info
        if not self.get_current_user_info():
            return False
        
        print("\n📝 Creating Posts...")
        
        # Step 3: Create Post 1 - General with hashtags
        post1_text = "Loving the new #SocialVibe features! #darkmode #hashtags are amazing 🎉"
        success1, post1_id = self.create_post(post1_text, "Post 1 - General with hashtags")
        
        # Step 4: Create Post 2 - Tech focused
        post2_text = "Just built something cool with #React and #FastAPI. The #backend integration is seamless! #coding"
        success2, post2_id = self.create_post(post2_text, "Post 2 - Tech focused")
        
        # Step 5: Create Post 3 - Casual
        post3_text = "Great day for #testing new features! #SocialVibe #QuickWins"
        success3, post3_id = self.create_post(post3_text, "Post 3 - Casual")
        
        # Step 6: Create Post 4 - Without hashtags
        post4_text = "This is a regular post without any hashtags. Testing the basic functionality."
        success4, post4_id = self.create_post(post4_text, "Post 4 - Without hashtags")
        
        # Step 7: Verify posts created
        print("\n🔍 Verification...")
        posts_verified = self.verify_posts_created()
        hashtags_verified = self.verify_hashtags_trending()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 SUMMARY")
        print("=" * 50)
        
        posts_created = sum([success1, success2, success3, success4])
        print(f"Posts created: {posts_created}/4")
        print(f"Feed verification: {'✅ PASS' if posts_verified else '❌ FAIL'}")
        print(f"Hashtags verification: {'✅ PASS' if hashtags_verified else '❌ FAIL'}")
        
        if posts_created == 4 and posts_verified and hashtags_verified:
            print("\n🎉 SUCCESS: All sample posts created successfully!")
            print("Frontend testing can now proceed with:")
            print("  - Save/Bookmark functionality")
            print("  - Hashtag parsing and linking")
            print("  - Post sharing")
            return True
        else:
            print("\n❌ FAILED: Some posts could not be created")
            return False

if __name__ == "__main__":
    creator = PostCreator()
    success = creator.create_sample_posts()
    exit(0 if success else 1)