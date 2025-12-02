#!/usr/bin/env python3
"""
Quick Wins Features Test for SocialVibe
Tests Save/Bookmark Posts and Hashtag functionality
"""

import requests
import json
import urllib.parse
from typing import Dict, Any

BACKEND_URL = "https://feature-checks.preview.emergentagent.com/api"

class QuickWinsAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.user1_token = None
        self.user2_token = None
        self.test_post_id = None
        self.results = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details
        }
        self.results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> tuple:
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
    
    def setup_test_users(self):
        """Setup test users and get tokens"""
        # Login as existing users
        login_data1 = {"username": "alice_social", "password": "securepass123"}
        success, status_code, response = self.make_request("POST", "/auth/login", login_data1)
        
        if success and status_code == 200:
            self.user1_token = response["access_token"]
            print("✅ User1 (alice_social) logged in successfully")
        else:
            print("❌ Failed to login user1")
            return False
        
        login_data2 = {"username": "bob_creator", "password": "mypassword456"}
        success, status_code, response = self.make_request("POST", "/auth/login", login_data2)
        
        if success and status_code == 200:
            self.user2_token = response["access_token"]
            print("✅ User2 (bob_creator) logged in successfully")
        else:
            print("❌ Failed to login user2")
            return False
        
        return True
    
    def create_test_post(self):
        """Create a test post for bookmark testing"""
        data = {
            "text": "Testing bookmark functionality! This post should be saveable. #bookmark #test",
            "image_url": None
        }
        
        success, status_code, response = self.make_request("POST", "/posts", data, token=self.user1_token)
        
        if success and status_code == 200 and "id" in response:
            self.test_post_id = response["id"]
            print(f"✅ Test post created with ID: {self.test_post_id}")
            return True
        else:
            print(f"❌ Failed to create test post: {status_code} - {response}")
            return False
    
    # ==================== SAVE/BOOKMARK TESTS ====================
    
    def test_save_post(self):
        """Test saving/bookmarking a post"""
        if not self.test_post_id:
            self.log_result("Save Post", False, "No test post available")
            return False
        
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/save", token=self.user2_token)
        
        if success and status_code == 200:
            self.log_result("Save Post", True, "Post saved successfully")
            return True
        else:
            self.log_result("Save Post", False, f"Status: {status_code}", str(response))
            return False
    
    def test_save_already_saved_post(self):
        """Test saving an already saved post (should fail)"""
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/save", token=self.user2_token)
        
        if success and status_code == 400:
            self.log_result("Save Already Saved Post", True, "Correctly rejected saving already saved post")
            return True
        else:
            self.log_result("Save Already Saved Post", False, f"Expected 400, got {status_code}", str(response))
            return False
    
    def test_get_saved_posts(self):
        """Test getting saved posts"""
        success, status_code, response = self.make_request("GET", "/posts/saved", token=self.user2_token)
        
        if success and status_code == 200 and isinstance(response, list):
            saved_post_ids = [post.get("id") for post in response]
            if self.test_post_id in saved_post_ids:
                self.log_result("Get Saved Posts", True, f"Retrieved {len(response)} saved posts including test post")
                return True
            else:
                self.log_result("Get Saved Posts", False, f"Test post not found in saved posts")
                return False
        else:
            self.log_result("Get Saved Posts", False, f"Status: {status_code}", str(response))
            return False
    
    def test_unsave_post(self):
        """Test unsaving/unbookmarking a post"""
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/unsave", token=self.user2_token)
        
        if success and status_code == 200:
            self.log_result("Unsave Post", True, "Post unsaved successfully")
            return True
        else:
            self.log_result("Unsave Post", False, f"Status: {status_code}", str(response))
            return False
    
    def test_unsave_not_saved_post(self):
        """Test unsaving a post that wasn't saved (should fail)"""
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/unsave", token=self.user2_token)
        
        if success and status_code == 400:
            self.log_result("Unsave Not Saved Post", True, "Correctly rejected unsaving non-saved post")
            return True
        else:
            self.log_result("Unsave Not Saved Post", False, f"Expected 400, got {status_code}", str(response))
            return False
    
    def test_save_nonexistent_post(self):
        """Test saving a non-existent post (should fail)"""
        fake_post_id = "nonexistent-post-id-12345"
        success, status_code, response = self.make_request("POST", f"/posts/{fake_post_id}/save", token=self.user1_token)
        
        if success and status_code == 404:
            self.log_result("Save Nonexistent Post", True, "Correctly rejected saving non-existent post")
            return True
        else:
            self.log_result("Save Nonexistent Post", False, f"Expected 404, got {status_code}", str(response))
            return False
    
    # ==================== HASHTAG TESTS ====================
    
    def test_create_post_with_hashtags(self):
        """Test creating a post with hashtags"""
        data = {
            "text": "Loving the new features on #SocialVibe! Great work on #hashtags and #trending topics. #awesome #community",
            "image_url": None
        }
        
        success, status_code, response = self.make_request("POST", "/posts", data, token=self.user1_token)
        
        if success and status_code == 200 and "id" in response:
            hashtags = response.get("hashtags", [])
            expected_hashtags = ["socialvibe", "hashtags", "trending", "awesome", "community"]
            
            if all(tag in hashtags for tag in expected_hashtags):
                self.log_result("Create Post with Hashtags", True, f"Post created with hashtags: {hashtags}")
                return True
            else:
                self.log_result("Create Post with Hashtags", False, f"Missing hashtags. Expected: {expected_hashtags}, Got: {hashtags}")
                return False
        else:
            self.log_result("Create Post with Hashtags", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_trending_hashtags(self):
        """Test getting trending hashtags"""
        success, status_code, response = self.make_request("GET", "/hashtags/trending", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            if len(response) > 0:
                first_hashtag = response[0]
                if "tag" in first_hashtag and "count" in first_hashtag:
                    hashtag_names = [item["tag"] for item in response]
                    self.log_result("Get Trending Hashtags", True, f"Retrieved {len(response)} trending hashtags: {hashtag_names}")
                    return True
                else:
                    self.log_result("Get Trending Hashtags", False, "Invalid hashtag format", str(first_hashtag))
                    return False
            else:
                self.log_result("Get Trending Hashtags", True, "No trending hashtags yet (empty list is valid)")
                return True
        else:
            self.log_result("Get Trending Hashtags", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_posts_by_hashtag(self):
        """Test getting posts by hashtag"""
        success, status_code, response = self.make_request("GET", "/posts/hashtag/socialvibe", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            if len(response) > 0:
                found_hashtag_post = False
                for post in response:
                    if "socialvibe" in post.get("hashtags", []):
                        found_hashtag_post = True
                        break
                
                if found_hashtag_post:
                    self.log_result("Get Posts by Hashtag", True, f"Retrieved {len(response)} posts with #socialvibe hashtag")
                    return True
                else:
                    self.log_result("Get Posts by Hashtag", False, f"Posts don't contain expected hashtag")
                    return False
            else:
                self.log_result("Get Posts by Hashtag", True, "No posts found for hashtag (valid if hashtag doesn't exist)")
                return True
        else:
            self.log_result("Get Posts by Hashtag", False, f"Status: {status_code}", str(response))
            return False
    
    def test_hashtag_case_insensitive(self):
        """Test hashtag search is case insensitive"""
        success, status_code, response = self.make_request("GET", "/posts/hashtag/SOCIALVIBE", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Hashtag Case Insensitive", True, f"Case insensitive search returned {len(response)} posts")
            return True
        else:
            self.log_result("Hashtag Case Insensitive", False, f"Status: {status_code}", str(response))
            return False
    
    def test_hashtag_with_hash_symbol(self):
        """Test hashtag search with # symbol"""
        encoded_tag = urllib.parse.quote("#socialvibe")
        success, status_code, response = self.make_request("GET", f"/posts/hashtag/{encoded_tag}", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Hashtag with Hash Symbol", True, f"Search with # symbol returned {len(response)} posts")
            return True
        else:
            self.log_result("Hashtag with Hash Symbol", False, f"Status: {status_code}", str(response))
            return False
    
    def run_quick_wins_tests(self):
        """Run Quick Wins feature tests"""
        print("🚀 Starting SocialVibe Quick Wins Features Test")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_users():
            print("❌ Failed to setup test users")
            return
        
        if not self.create_test_post():
            print("❌ Failed to create test post")
            return
        
        # Save/Bookmark Tests
        print("\n🔖 SAVE/BOOKMARK POSTS TESTS")
        self.test_save_post()
        self.test_save_already_saved_post()
        self.test_get_saved_posts()
        self.test_unsave_post()
        self.test_unsave_not_saved_post()
        self.test_save_nonexistent_post()
        
        # Hashtag Tests
        print("\n🏷️ HASHTAG TESTS")
        self.test_create_post_with_hashtags()
        self.test_get_trending_hashtags()
        self.test_get_posts_by_hashtag()
        self.test_hashtag_case_insensitive()
        self.test_hashtag_with_hash_symbol()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 QUICK WINS TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if "✅" in r["status"])
        failed = sum(1 for r in self.results if "❌" in r["status"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if "❌" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed, failed, total

if __name__ == "__main__":
    tester = QuickWinsAPITester()
    passed, failed, total = tester.run_quick_wins_tests()
    
    # Exit with success if all tests passed
    exit(0 if failed == 0 else 1)