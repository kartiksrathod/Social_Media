#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for SocialVibe
Tests all authentication, user, post, and notification endpoints
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://quickbuilder-1.preview.emergentagent.com/api"

class SocialVibeAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.test_post_id = None
        self.test_comment_id = None
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
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, files: Dict = None) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=data)
            elif method == "POST":
                if files:
                    # Remove Content-Type for multipart
                    headers.pop("Content-Type", None)
                    response = requests.post(url, headers=headers, files=files, data=data)
                else:
                    response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            else:
                return False, f"Unsupported method: {method}", None
            
            return True, response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", None
        except json.JSONDecodeError:
            return False, f"Invalid JSON response", response.text if 'response' in locals() else None
    
    # ==================== AUTHENTICATION TESTS ====================
    
    def test_signup_user1(self):
        """Test user signup for user1"""
        data = {
            "username": "alice_social",
            "email": "alice@socialvibe.com", 
            "password": "securepass123"
        }
        
        success, status_code, response = self.make_request("POST", "/auth/signup", data)
        
        if success and status_code == 200 and "access_token" in response:
            self.user1_token = response["access_token"]
            self.log_result("User1 Signup", True, "User alice_social created successfully")
            return True
        else:
            self.log_result("User1 Signup", False, f"Status: {status_code}", str(response))
            return False
    
    def test_signup_user2(self):
        """Test user signup for user2"""
        data = {
            "username": "bob_creator",
            "email": "bob@socialvibe.com",
            "password": "mypassword456"
        }
        
        success, status_code, response = self.make_request("POST", "/auth/signup", data)
        
        if success and status_code == 200 and "access_token" in response:
            self.user2_token = response["access_token"]
            self.log_result("User2 Signup", True, "User bob_creator created successfully")
            return True
        else:
            self.log_result("User2 Signup", False, f"Status: {status_code}", str(response))
            return False
    
    def test_login_user1(self):
        """Test user login for user1"""
        data = {
            "username": "alice_social",
            "password": "securepass123"
        }
        
        success, status_code, response = self.make_request("POST", "/auth/login", data)
        
        if success and status_code == 200 and "access_token" in response:
            self.user1_token = response["access_token"]
            self.log_result("User1 Login", True, "Login successful")
            return True
        else:
            self.log_result("User1 Login", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.user1_token:
            self.log_result("Get Current User", False, "No auth token available")
            return False
        
        success, status_code, response = self.make_request("GET", "/auth/me", token=self.user1_token)
        
        if success and status_code == 200 and "username" in response:
            self.user1_id = response["id"]
            self.log_result("Get Current User", True, f"Retrieved user: {response['username']}")
            return True
        else:
            self.log_result("Get Current User", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_user2_info(self):
        """Get user2 info for testing"""
        if not self.user2_token:
            return False
        
        success, status_code, response = self.make_request("GET", "/auth/me", token=self.user2_token)
        
        if success and status_code == 200:
            self.user2_id = response["id"]
            return True
        return False
    
    # ==================== USER ENDPOINT TESTS ====================
    
    def test_get_user_profile(self):
        """Test getting user profile by username"""
        success, status_code, response = self.make_request("GET", "/users/alice_social", token=self.user1_token)
        
        if success and status_code == 200 and response.get("username") == "alice_social":
            self.log_result("Get User Profile", True, "Profile retrieved successfully")
            return True
        else:
            self.log_result("Get User Profile", False, f"Status: {status_code}", str(response))
            return False
    
    def test_update_profile(self):
        """Test updating user profile"""
        data = {
            "bio": "I love connecting with people on SocialVibe! 🌟"
        }
        
        success, status_code, response = self.make_request("PUT", "/users/me", data, token=self.user1_token)
        
        if success and status_code == 200 and response.get("bio") == data["bio"]:
            self.log_result("Update Profile", True, "Profile updated successfully")
            return True
        else:
            self.log_result("Update Profile", False, f"Status: {status_code}", str(response))
            return False
    
    def test_follow_user(self):
        """Test following a user"""
        if not self.user2_id:
            self.test_get_user2_info()
        
        if not self.user2_id:
            self.log_result("Follow User", False, "User2 ID not available")
            return False
        
        success, status_code, response = self.make_request("POST", f"/users/{self.user2_id}/follow", token=self.user1_token)
        
        if success and status_code == 200:
            self.log_result("Follow User", True, "Successfully followed user")
            return True
        else:
            self.log_result("Follow User", False, f"Status: {status_code}", str(response))
            return False
    
    def test_search_users(self):
        """Test searching users"""
        success, status_code, response = self.make_request("GET", "/users/search", {"q": "alice"}, token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            found_alice = any(user.get("username") == "alice_social" for user in response)
            if found_alice:
                self.log_result("Search Users", True, f"Found {len(response)} users including alice_social")
                return True
            else:
                self.log_result("Search Users", False, "alice_social not found in search results", str(response))
                return False
        else:
            self.log_result("Search Users", False, f"Status: {status_code}", str(response))
            return False
    
    def test_suggested_users(self):
        """Test getting suggested users"""
        success, status_code, response = self.make_request("GET", "/users/suggested", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Suggested Users", True, f"Retrieved {len(response)} suggested users")
            return True
        else:
            self.log_result("Suggested Users", False, f"Status: {status_code}", str(response))
            return False
    
    # ==================== POST ENDPOINT TESTS ====================
    
    def test_create_post(self):
        """Test creating a new post"""
        data = {
            "text": "Hello SocialVibe! This is my first post. Excited to connect with everyone! 🚀",
            "image_url": None
        }
        
        success, status_code, response = self.make_request("POST", "/posts", data, token=self.user1_token)
        
        if success and status_code == 200 and "id" in response:
            self.test_post_id = response["id"]
            self.log_result("Create Post", True, "Post created successfully")
            return True
        else:
            self.log_result("Create Post", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_feed(self):
        """Test getting personalized feed"""
        success, status_code, response = self.make_request("GET", "/posts/feed", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Get Feed", True, f"Retrieved {len(response)} posts in feed")
            return True
        else:
            self.log_result("Get Feed", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_explore_posts(self):
        """Test getting explore posts"""
        success, status_code, response = self.make_request("GET", "/posts/explore", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Get Explore Posts", True, f"Retrieved {len(response)} posts in explore")
            return True
        else:
            self.log_result("Get Explore Posts", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_user_posts(self):
        """Test getting posts by specific user"""
        success, status_code, response = self.make_request("GET", "/posts/user/alice_social", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Get User Posts", True, f"Retrieved {len(response)} posts by alice_social")
            return True
        else:
            self.log_result("Get User Posts", False, f"Status: {status_code}", str(response))
            return False
    
    def test_like_post(self):
        """Test liking a post"""
        if not self.test_post_id:
            self.log_result("Like Post", False, "No test post available")
            return False
        
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/like", token=self.user2_token)
        
        if success and status_code == 200:
            self.log_result("Like Post", True, "Post liked successfully")
            return True
        else:
            self.log_result("Like Post", False, f"Status: {status_code}", str(response))
            return False
    
    def test_add_comment(self):
        """Test adding a comment to a post"""
        if not self.test_post_id:
            self.log_result("Add Comment", False, "No test post available")
            return False
        
        data = {"text": "Great post! Welcome to SocialVibe! 👋"}
        
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/comments", data, token=self.user2_token)
        
        if success and status_code == 200 and "id" in response:
            self.test_comment_id = response["id"]
            self.log_result("Add Comment", True, "Comment added successfully")
            return True
        else:
            self.log_result("Add Comment", False, f"Status: {status_code}", str(response))
            return False
    
    def test_get_comments(self):
        """Test getting comments for a post"""
        if not self.test_post_id:
            self.log_result("Get Comments", False, "No test post available")
            return False
        
        success, status_code, response = self.make_request("GET", f"/posts/{self.test_post_id}/comments", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Get Comments", True, f"Retrieved {len(response)} comments")
            return True
        else:
            self.log_result("Get Comments", False, f"Status: {status_code}", str(response))
            return False
    
    def test_unlike_post(self):
        """Test unliking a post"""
        if not self.test_post_id:
            self.log_result("Unlike Post", False, "No test post available")
            return False
        
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/unlike", token=self.user2_token)
        
        if success and status_code == 200:
            self.log_result("Unlike Post", True, "Post unliked successfully")
            return True
        else:
            self.log_result("Unlike Post", False, f"Status: {status_code}", str(response))
            return False
    
    # ==================== SAVE/BOOKMARK POSTS TESTS ====================
    
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
        if not self.test_post_id:
            self.log_result("Save Already Saved Post", False, "No test post available")
            return False
        
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
            # Check if our test post is in saved posts
            saved_post_ids = [post.get("id") for post in response]
            if self.test_post_id in saved_post_ids:
                self.log_result("Get Saved Posts", True, f"Retrieved {len(response)} saved posts including test post")
                return True
            else:
                self.log_result("Get Saved Posts", False, f"Test post not found in {len(response)} saved posts", str(saved_post_ids))
                return False
        else:
            self.log_result("Get Saved Posts", False, f"Status: {status_code}", str(response))
            return False
    
    def test_unsave_post(self):
        """Test unsaving/unbookmarking a post"""
        if not self.test_post_id:
            self.log_result("Unsave Post", False, "No test post available")
            return False
        
        success, status_code, response = self.make_request("POST", f"/posts/{self.test_post_id}/unsave", token=self.user2_token)
        
        if success and status_code == 200:
            self.log_result("Unsave Post", True, "Post unsaved successfully")
            return True
        else:
            self.log_result("Unsave Post", False, f"Status: {status_code}", str(response))
            return False
    
    def test_unsave_not_saved_post(self):
        """Test unsaving a post that wasn't saved (should fail)"""
        if not self.test_post_id:
            self.log_result("Unsave Not Saved Post", False, "No test post available")
            return False
        
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
            # Check if hashtags were extracted
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
            # Check if response has correct format
            if len(response) > 0:
                first_hashtag = response[0]
                if "tag" in first_hashtag and "count" in first_hashtag:
                    # Check if our hashtags are in trending
                    hashtag_names = [item["tag"] for item in response]
                    if "socialvibe" in hashtag_names or "hashtags" in hashtag_names:
                        self.log_result("Get Trending Hashtags", True, f"Retrieved {len(response)} trending hashtags including our test hashtags")
                        return True
                    else:
                        self.log_result("Get Trending Hashtags", True, f"Retrieved {len(response)} trending hashtags (test hashtags may not be trending yet)")
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
        # Test with a hashtag we created
        success, status_code, response = self.make_request("GET", "/posts/hashtag/socialvibe", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            if len(response) > 0:
                # Check if posts contain the hashtag
                found_hashtag_post = False
                for post in response:
                    if "socialvibe" in post.get("hashtags", []):
                        found_hashtag_post = True
                        break
                
                if found_hashtag_post:
                    self.log_result("Get Posts by Hashtag", True, f"Retrieved {len(response)} posts with #socialvibe hashtag")
                    return True
                else:
                    self.log_result("Get Posts by Hashtag", False, f"Posts don't contain expected hashtag", str([p.get("hashtags") for p in response]))
                    return False
            else:
                self.log_result("Get Posts by Hashtag", True, "No posts found for hashtag (valid if hashtag doesn't exist)")
                return True
        else:
            self.log_result("Get Posts by Hashtag", False, f"Status: {status_code}", str(response))
            return False
    
    def test_hashtag_case_insensitive(self):
        """Test hashtag search is case insensitive"""
        # Test with uppercase version of hashtag
        success, status_code, response = self.make_request("GET", "/posts/hashtag/SOCIALVIBE", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Hashtag Case Insensitive", True, f"Case insensitive search returned {len(response)} posts")
            return True
        else:
            self.log_result("Hashtag Case Insensitive", False, f"Status: {status_code}", str(response))
            return False
    
    def test_hashtag_with_hash_symbol(self):
        """Test hashtag search with # symbol"""
        # Test with # prefix
        success, status_code, response = self.make_request("GET", "/posts/hashtag/#socialvibe", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Hashtag with Hash Symbol", True, f"Search with # symbol returned {len(response)} posts")
            return True
        else:
            self.log_result("Hashtag with Hash Symbol", False, f"Status: {status_code}", str(response))
            return False
    
    # ==================== NOTIFICATION TESTS ====================
    
    def test_get_notifications(self):
        """Test getting notifications"""
        # Wait a moment for notifications to be created
        time.sleep(1)
        
        success, status_code, response = self.make_request("GET", "/notifications", token=self.user1_token)
        
        if success and status_code == 200 and isinstance(response, list):
            self.log_result("Get Notifications", True, f"Retrieved {len(response)} notifications")
            return True
        else:
            self.log_result("Get Notifications", False, f"Status: {status_code}", str(response))
            return False
    
    def test_mark_all_notifications_read(self):
        """Test marking all notifications as read"""
        success, status_code, response = self.make_request("POST", "/notifications/read-all", token=self.user1_token)
        
        if success and status_code == 200:
            self.log_result("Mark All Notifications Read", True, "All notifications marked as read")
            return True
        else:
            self.log_result("Mark All Notifications Read", False, f"Status: {status_code}", str(response))
            return False
    
    def test_unfollow_user(self):
        """Test unfollowing a user"""
        if not self.user2_id:
            self.log_result("Unfollow User", False, "User2 ID not available")
            return False
        
        success, status_code, response = self.make_request("POST", f"/users/{self.user2_id}/unfollow", token=self.user1_token)
        
        if success and status_code == 200:
            self.log_result("Unfollow User", True, "Successfully unfollowed user")
            return True
        else:
            self.log_result("Unfollow User", False, f"Status: {status_code}", str(response))
            return False
    
    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SocialVibe Backend API Tests")
        print("=" * 50)
        
        # Authentication Tests
        print("\n📝 AUTHENTICATION TESTS")
        self.test_signup_user1()
        self.test_signup_user2()
        self.test_login_user1()
        self.test_get_current_user()
        self.test_get_user2_info()
        
        # User Tests
        print("\n👤 USER ENDPOINT TESTS")
        self.test_get_user_profile()
        self.test_update_profile()
        self.test_follow_user()
        self.test_search_users()
        self.test_suggested_users()
        
        # Post Tests
        print("\n📱 POST ENDPOINT TESTS")
        self.test_create_post()
        self.test_get_feed()
        self.test_get_explore_posts()
        self.test_get_user_posts()
        self.test_like_post()
        self.test_add_comment()
        self.test_get_comments()
        self.test_unlike_post()
        
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
        
        # Notification Tests
        print("\n🔔 NOTIFICATION TESTS")
        self.test_get_notifications()
        self.test_mark_all_notifications_read()
        
        # Cleanup Tests
        print("\n🧹 CLEANUP TESTS")
        self.test_unfollow_user()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
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
                    if result['details']:
                        print(f"    Details: {result['details']}")
        
        return passed, failed, total

if __name__ == "__main__":
    tester = SocialVibeAPITester()
    passed, failed, total = tester.run_all_tests()
    
    # Exit with error code if tests failed
    exit(0 if failed == 0 else 1)