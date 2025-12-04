#!/usr/bin/env python3
"""
SocialVibe Backend Testing Suite - Close Friends Feature
Tests Close Friends Management, Post Visibility, Feed Filtering, and Notifications
"""

import requests
import json
import time
import os
import io
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://social-enhance.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class SocialVibeBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.test_users = {}
        self.test_results = []
        self.close_friends_posts = []
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status_icon = "✅" if status == "PASS" else "❌"
        print(f"{status_icon} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def create_test_users(self):
        """Create test users for Close Friends testing"""
        users = [
            {"username": "alice_cf", "email": "alice@closefriends.com", "password": "password123"},
            {"username": "bob_cf", "email": "bob@closefriends.com", "password": "password123"},
            {"username": "charlie_cf", "email": "charlie@closefriends.com", "password": "password123"}
        ]
        
        for user_data in users:
            try:
                # Try to register user
                response = requests.post(f"{self.base_url}/auth/signup", json=user_data)
                if response.status_code in [200, 201]:
                    # Login to get token
                    login_response = requests.post(f"{self.base_url}/auth/login", json={
                        "username": user_data["username"],
                        "password": user_data["password"]
                    })
                    if login_response.status_code == 200:
                        token_data = login_response.json()
                        self.test_users[user_data["username"]] = {
                            "token": token_data.get("access_token"),
                            "user_id": token_data.get("user", {}).get("id"),
                            "username": user_data["username"]
                        }
                        self.log_test(f"Create user {user_data['username']}", "PASS")
                    else:
                        self.log_test(f"Login user {user_data['username']}", "FAIL", f"Status: {login_response.status_code}")
                elif response.status_code == 400 and "already exists" in response.text.lower():
                    # User exists, try to login
                    login_response = requests.post(f"{self.base_url}/auth/login", json={
                        "username": user_data["username"],
                        "password": user_data["password"]
                    })
                    if login_response.status_code == 200:
                        token_data = login_response.json()
                        self.test_users[user_data["username"]] = {
                            "token": token_data.get("access_token"),
                            "user_id": token_data.get("user", {}).get("id"),
                            "username": user_data["username"]
                        }
                        self.log_test(f"Login existing user {user_data['username']}", "PASS")
                    else:
                        self.log_test(f"Login existing user {user_data['username']}", "FAIL", f"Status: {login_response.status_code}")
                else:
                    self.log_test(f"Create user {user_data['username']}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Create user {user_data['username']}", "FAIL", str(e))
    
    def get_auth_headers(self, username):
        """Get authorization headers for a user"""
        if username not in self.test_users:
            return self.headers
        token = self.test_users[username]["token"]
        headers = self.headers.copy()
        headers["Authorization"] = f"Bearer {token}"
        return headers
    
    def create_sample_video_file(self):
        """Create a small sample video file for testing"""
        # Create a minimal MP4 file (just headers, not a real video)
        mp4_header = b'\x00\x00\x00\x20ftypmp41\x00\x00\x00\x00mp41isom\x00\x00\x00\x08free'
        return io.BytesIO(mp4_header)
    
    def create_sample_image_file(self):
        """Create a small sample image file for testing"""
        # Create a minimal PNG file
        png_header = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        return io.BytesIO(png_header)
    
    # ==================== CLOSE FRIENDS MANAGEMENT TESTS ====================
    
    def test_add_close_friend_success(self):
        """Test POST /api/users/close-friends/add - Success case"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            
            response = requests.post(f"{self.base_url}/users/close-friends/add", 
                                   json={"user_id": bob_user_id}, headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'successfully' in data['message'].lower():
                    self.log_test("Add close friend - Success", "PASS", f"Bob added to Alice's close friends")
                else:
                    self.log_test("Add close friend - Success", "FAIL", f"Unexpected response: {data}")
            else:
                self.log_test("Add close friend - Success", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Add close friend - Success", "FAIL", str(e))
    
    def test_add_close_friend_missing_user_id(self):
        """Test POST /api/users/close-friends/add - Missing user_id"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            
            response = requests.post(f"{self.base_url}/users/close-friends/add", 
                                   json={}, headers=alice_headers)
            
            if response.status_code == 400:
                self.log_test("Add close friend - Missing user_id", "PASS", "Correctly rejected missing user_id")
            else:
                self.log_test("Add close friend - Missing user_id", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Add close friend - Missing user_id", "FAIL", str(e))
    
    def test_add_close_friend_nonexistent_user(self):
        """Test POST /api/users/close-friends/add - Non-existent user"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            
            response = requests.post(f"{self.base_url}/users/close-friends/add", 
                                   json={"user_id": "nonexistent-user-id"}, headers=alice_headers)
            
            if response.status_code == 404:
                self.log_test("Add close friend - Non-existent user", "PASS", "Correctly rejected non-existent user")
            else:
                self.log_test("Add close friend - Non-existent user", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Add close friend - Non-existent user", "FAIL", str(e))
    
    def test_add_close_friend_self(self):
        """Test POST /api/users/close-friends/add - Cannot add self"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            alice_user_id = self.test_users["alice_cf"]["user_id"]
            
            response = requests.post(f"{self.base_url}/users/close-friends/add", 
                                   json={"user_id": alice_user_id}, headers=alice_headers)
            
            if response.status_code == 400:
                self.log_test("Add close friend - Self add", "PASS", "Correctly rejected self-add")
            else:
                self.log_test("Add close friend - Self add", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Add close friend - Self add", "FAIL", str(e))
    
    def test_add_close_friend_duplicate(self):
        """Test POST /api/users/close-friends/add - Already in close friends"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            
            # First add Bob (should succeed)
            requests.post(f"{self.base_url}/users/close-friends/add", 
                         json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Try to add Bob again (should fail)
            response = requests.post(f"{self.base_url}/users/close-friends/add", 
                                   json={"user_id": bob_user_id}, headers=alice_headers)
            
            if response.status_code == 400:
                self.log_test("Add close friend - Duplicate", "PASS", "Correctly rejected duplicate add")
            else:
                self.log_test("Add close friend - Duplicate", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Add close friend - Duplicate", "FAIL", str(e))
    
    def test_remove_close_friend_success(self):
        """Test DELETE /api/users/close-friends/remove - Success case"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            
            # First add Bob to close friends
            requests.post(f"{self.base_url}/users/close-friends/add", 
                         json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Now remove Bob
            response = requests.delete(f"{self.base_url}/users/close-friends/remove", 
                                     json={"user_id": bob_user_id}, headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'successfully' in data['message'].lower():
                    self.log_test("Remove close friend - Success", "PASS", f"Bob removed from Alice's close friends")
                else:
                    self.log_test("Remove close friend - Success", "FAIL", f"Unexpected response: {data}")
            else:
                self.log_test("Remove close friend - Success", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Remove close friend - Success", "FAIL", str(e))
    
    def test_remove_close_friend_missing_user_id(self):
        """Test DELETE /api/users/close-friends/remove - Missing user_id"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            
            response = requests.delete(f"{self.base_url}/users/close-friends/remove", 
                                     json={}, headers=alice_headers)
            
            if response.status_code == 400:
                self.log_test("Remove close friend - Missing user_id", "PASS", "Correctly rejected missing user_id")
            else:
                self.log_test("Remove close friend - Missing user_id", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Remove close friend - Missing user_id", "FAIL", str(e))
    
    def test_remove_close_friend_not_in_list(self):
        """Test DELETE /api/users/close-friends/remove - User not in close friends"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            charlie_user_id = self.test_users["charlie_cf"]["user_id"]
            
            # Try to remove Charlie without adding him first
            response = requests.delete(f"{self.base_url}/users/close-friends/remove", 
                                     json={"user_id": charlie_user_id}, headers=alice_headers)
            
            if response.status_code == 400:
                self.log_test("Remove close friend - Not in list", "PASS", "Correctly rejected removal of non-close friend")
            else:
                self.log_test("Remove close friend - Not in list", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Remove close friend - Not in list", "FAIL", str(e))
    
    def test_get_close_friends_list(self):
        """Test GET /api/users/close-friends - Get close friends list"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            
            # Add Bob to close friends first
            requests.post(f"{self.base_url}/users/close-friends/add", 
                         json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Get close friends list
            response = requests.get(f"{self.base_url}/users/close-friends", headers=alice_headers)
            
            if response.status_code == 200:
                close_friends = response.json()
                if isinstance(close_friends, list):
                    bob_found = any(friend.get('id') == bob_user_id for friend in close_friends)
                    if bob_found:
                        self.log_test("Get close friends list", "PASS", f"Found {len(close_friends)} close friends including Bob")
                    else:
                        self.log_test("Get close friends list", "FAIL", "Bob not found in close friends list")
                else:
                    self.log_test("Get close friends list", "FAIL", "Response is not a list")
            else:
                self.log_test("Get close friends list", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get close friends list", "FAIL", str(e))
    
    def test_check_is_close_friend(self):
        """Test GET /api/users/:userId/is-close-friend - Check close friend status"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            charlie_user_id = self.test_users["charlie_cf"]["user_id"]
            
            # Add Bob to close friends
            requests.post(f"{self.base_url}/users/close-friends/add", 
                         json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Check Bob's status (should be true)
            response = requests.get(f"{self.base_url}/users/{bob_user_id}/is-close-friend", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('is_close_friend') == True:
                    self.log_test("Check is close friend - True case", "PASS", "Bob correctly identified as close friend")
                else:
                    self.log_test("Check is close friend - True case", "FAIL", f"Expected true, got: {data}")
            else:
                self.log_test("Check is close friend - True case", "FAIL", f"Status: {response.status_code}")
            
            # Check Charlie's status (should be false)
            response = requests.get(f"{self.base_url}/users/{charlie_user_id}/is-close-friend", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('is_close_friend') == False:
                    self.log_test("Check is close friend - False case", "PASS", "Charlie correctly identified as not close friend")
                else:
                    self.log_test("Check is close friend - False case", "FAIL", f"Expected false, got: {data}")
            else:
                self.log_test("Check is close friend - False case", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Check is close friend", "FAIL", str(e))
    
    # ==================== POST VISIBILITY TESTS ====================
    
    def test_create_post_with_visibility(self):
        """Test POST /api/posts with visibility parameter"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            
            # Create public post
            public_post_data = {
                "text": "This is a public post for everyone to see! #public #socialvibe",
                "visibility": "public"
            }
            
            response = requests.post(f"{self.base_url}/posts", json=public_post_data, headers=alice_headers)
            
            if response.status_code == 201:
                post = response.json()
                if post.get('visibility') == 'public':
                    self.log_test("Create public post", "PASS", f"Public post created: {post['id']}")
                else:
                    self.log_test("Create public post", "FAIL", f"Expected public visibility, got: {post.get('visibility')}")
            else:
                self.log_test("Create public post", "FAIL", f"Status: {response.status_code}")
            
            # Create close friends post
            close_friends_post_data = {
                "text": "This is a close friends only post! Secret stuff here 🤫 #closefriends",
                "visibility": "close_friends"
            }
            
            response = requests.post(f"{self.base_url}/posts", json=close_friends_post_data, headers=alice_headers)
            
            if response.status_code == 201:
                post = response.json()
                if post.get('visibility') == 'close_friends':
                    self.close_friends_posts.append(post['id'])
                    self.log_test("Create close friends post", "PASS", f"Close friends post created: {post['id']}")
                else:
                    self.log_test("Create close friends post", "FAIL", f"Expected close_friends visibility, got: {post.get('visibility')}")
            else:
                self.log_test("Create close friends post", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create post with visibility", "FAIL", str(e))
    
    def test_edit_post_visibility(self):
        """Test PUT /api/posts/:postId with visibility parameter"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            
            # Create a public post first
            post_data = {
                "text": "This post will change visibility! #test",
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/posts", json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Edit post to change visibility to close_friends
                edit_data = {
                    "text": "This post is now for close friends only! #test #closefriends",
                    "visibility": "close_friends"
                }
                
                response = requests.put(f"{self.base_url}/posts/{post_id}", json=edit_data, headers=alice_headers)
                
                if response.status_code == 200:
                    updated_post = response.json()
                    if updated_post.get('visibility') == 'close_friends':
                        self.log_test("Edit post visibility", "PASS", f"Post visibility changed to close_friends")
                    else:
                        self.log_test("Edit post visibility", "FAIL", f"Expected close_friends, got: {updated_post.get('visibility')}")
                else:
                    self.log_test("Edit post visibility", "FAIL", f"Edit status: {response.status_code}")
            else:
                self.log_test("Edit post visibility", "FAIL", f"Create status: {create_response.status_code}")
        except Exception as e:
            self.log_test("Edit post visibility", "FAIL", str(e))
    
    def test_feed_filtering_close_friends(self):
        """Test GET /api/posts/feed - Close friends can see close_friends posts"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_headers = self.get_auth_headers("bob_cf")
            charlie_headers = self.get_auth_headers("charlie_cf")
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            
            # Alice adds Bob to close friends
            requests.post(f"{self.base_url}/users/close-friends/add", 
                         json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Bob follows Alice to see her posts in feed
            alice_user_id = self.test_users["alice_cf"]["user_id"]
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=bob_headers)
            
            # Alice creates a close friends post
            close_friends_post = {
                "text": "Secret close friends post! Only Bob should see this 🤫 #secret",
                "visibility": "close_friends"
            }
            
            create_response = requests.post(f"{self.base_url}/posts", json=close_friends_post, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob (close friend) should see the post in his feed
                bob_feed_response = requests.get(f"{self.base_url}/posts/feed", headers=bob_headers)
                
                if bob_feed_response.status_code == 200:
                    bob_feed = bob_feed_response.json()
                    close_friends_post_found = any(p.get('id') == post_id for p in bob_feed)
                    
                    if close_friends_post_found:
                        self.log_test("Feed filtering - Close friend can see", "PASS", "Bob can see Alice's close friends post")
                    else:
                        self.log_test("Feed filtering - Close friend can see", "FAIL", "Bob cannot see Alice's close friends post")
                else:
                    self.log_test("Feed filtering - Close friend can see", "FAIL", f"Bob feed status: {bob_feed_response.status_code}")
                
                # Charlie (not close friend) should NOT see the post in his feed
                charlie_user_id = self.test_users["charlie_cf"]["user_id"]
                requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=charlie_headers)
                
                charlie_feed_response = requests.get(f"{self.base_url}/posts/feed", headers=charlie_headers)
                
                if charlie_feed_response.status_code == 200:
                    charlie_feed = charlie_feed_response.json()
                    close_friends_post_found = any(p.get('id') == post_id for p in charlie_feed)
                    
                    if not close_friends_post_found:
                        self.log_test("Feed filtering - Non-close friend cannot see", "PASS", "Charlie cannot see Alice's close friends post")
                    else:
                        self.log_test("Feed filtering - Non-close friend cannot see", "FAIL", "Charlie can see Alice's close friends post (should not)")
                else:
                    self.log_test("Feed filtering - Non-close friend cannot see", "FAIL", f"Charlie feed status: {charlie_feed_response.status_code}")
            else:
                self.log_test("Feed filtering", "FAIL", f"Post creation failed: {create_response.status_code}")
        except Exception as e:
            self.log_test("Feed filtering", "FAIL", str(e))
    
    def test_author_can_see_own_close_friends_posts(self):
        """Test that authors can always see their own close_friends posts"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            
            # Alice creates a close friends post
            close_friends_post = {
                "text": "Alice's own close friends post! She should see this in her own feed 📝 #ownpost",
                "visibility": "close_friends"
            }
            
            create_response = requests.post(f"{self.base_url}/posts", json=close_friends_post, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Alice should see her own close friends post in her feed
                alice_feed_response = requests.get(f"{self.base_url}/posts/feed", headers=alice_headers)
                
                if alice_feed_response.status_code == 200:
                    alice_feed = alice_feed_response.json()
                    own_post_found = any(p.get('id') == post_id for p in alice_feed)
                    
                    if own_post_found:
                        self.log_test("Author sees own close friends posts", "PASS", "Alice can see her own close friends post")
                    else:
                        self.log_test("Author sees own close friends posts", "FAIL", "Alice cannot see her own close friends post")
                else:
                    self.log_test("Author sees own close friends posts", "FAIL", f"Alice feed status: {alice_feed_response.status_code}")
            else:
                self.log_test("Author sees own close friends posts", "FAIL", f"Post creation failed: {create_response.status_code}")
        except Exception as e:
            self.log_test("Author sees own close friends posts", "FAIL", str(e))
    
    def test_explore_shows_only_public_posts(self):
        """Test GET /api/posts/explore - Should show only public posts"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_headers = self.get_auth_headers("bob_cf")
            
            # Alice creates both public and close friends posts
            public_post = {
                "text": "This is a public post for explore! Everyone should see this 🌍 #public #explore",
                "visibility": "public"
            }
            
            close_friends_post = {
                "text": "This is a close friends post! Should NOT appear in explore 🔒 #secret",
                "visibility": "close_friends"
            }
            
            public_response = requests.post(f"{self.base_url}/posts", json=public_post, headers=alice_headers)
            close_friends_response = requests.post(f"{self.base_url}/posts", json=close_friends_post, headers=alice_headers)
            
            if public_response.status_code == 201 and close_friends_response.status_code == 201:
                public_post_id = public_response.json()['id']
                close_friends_post_id = close_friends_response.json()['id']
                
                # Check explore feed (should only show public post)
                explore_response = requests.get(f"{self.base_url}/posts/explore", headers=bob_headers)
                
                if explore_response.status_code == 200:
                    explore_posts = explore_response.json()
                    
                    public_found = any(p.get('id') == public_post_id for p in explore_posts)
                    close_friends_found = any(p.get('id') == close_friends_post_id for p in explore_posts)
                    
                    if public_found and not close_friends_found:
                        self.log_test("Explore shows only public posts", "PASS", "Public post visible, close friends post hidden")
                    elif not public_found:
                        self.log_test("Explore shows only public posts", "FAIL", "Public post not found in explore")
                    elif close_friends_found:
                        self.log_test("Explore shows only public posts", "FAIL", "Close friends post found in explore (should be hidden)")
                    else:
                        self.log_test("Explore shows only public posts", "FAIL", "Neither post found in explore")
                else:
                    self.log_test("Explore shows only public posts", "FAIL", f"Explore status: {explore_response.status_code}")
            else:
                self.log_test("Explore shows only public posts", "FAIL", "Post creation failed")
        except Exception as e:
            self.log_test("Explore shows only public posts", "FAIL", str(e))
    
    def test_delete_own_story(self):
        """Test deleting own story"""
        try:
            headers = self.get_auth_headers("storyuser")
            
            # Create a story to delete
            image_file = self.create_sample_image_file()
            files = {'file': ('delete_test.png', image_file, 'image/png')}
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            upload_response = requests.post(f"{self.base_url}/stories/upload", 
                                          headers=upload_headers, files=files)
            
            if upload_response.status_code == 200:
                media_data = upload_response.json()
                
                story_data = {
                    "media_url": media_data['url'],
                    "media_type": "image"
                }
                
                story_response = requests.post(f"{self.base_url}/stories", json=story_data, headers=headers)
                
                if story_response.status_code == 201:
                    story = story_response.json()
                    story_id = story['id']
                    
                    # Delete the story
                    delete_response = requests.delete(f"{self.base_url}/stories/{story_id}", headers=headers)
                    
                    if delete_response.status_code == 200:
                        self.log_test("Delete own story", "PASS", f"Story {story_id} deleted successfully")
                    else:
                        self.log_test("Delete own story", "FAIL", f"Delete status: {delete_response.status_code}")
                else:
                    self.log_test("Delete own story", "FAIL", "Story creation failed")
            else:
                self.log_test("Delete own story", "FAIL", "Image upload failed")
        except Exception as e:
            self.log_test("Delete own story", "FAIL", str(e))
    
    def test_cleanup_expired_stories(self):
        """Test cleanup of expired stories"""
        try:
            response = requests.delete(f"{self.base_url}/stories/cleanup/expired")
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    self.log_test("Cleanup expired stories", "PASS", data['message'])
                else:
                    self.log_test("Cleanup expired stories", "FAIL", "No message in response")
            else:
                self.log_test("Cleanup expired stories", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Cleanup expired stories", "FAIL", str(e))
    
    # ==================== DIRECT MESSAGING TESTS ====================
    
    def test_create_conversation(self):
        """Test creating conversation between users"""
        try:
            user1_headers = self.get_auth_headers("videouser")
            user2_id = self.test_users["storyuser"]["user_id"]
            
            conversation_data = {
                "participant_id": user2_id
            }
            
            response = requests.post(f"{self.base_url}/messages/conversations", 
                                   json=conversation_data, headers=user1_headers)
            
            if response.status_code in [200, 201]:
                conversation = response.json()
                required_fields = ['id', 'participants', 'participant_info']
                
                if all(field in conversation for field in required_fields):
                    self.conversation_id = conversation['id']
                    self.log_test("Create conversation", "PASS", f"Conversation created: {conversation['id']}")
                else:
                    self.log_test("Create conversation", "FAIL", "Missing required fields")
            else:
                self.log_test("Create conversation", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create conversation", "FAIL", str(e))
    
    def test_send_message(self):
        """Test sending messages in conversation"""
        try:
            user1_headers = self.get_auth_headers("videouser")
            
            # First ensure we have a conversation
            if not hasattr(self, 'conversation_id'):
                self.test_create_conversation()
            
            if hasattr(self, 'conversation_id'):
                message_data = {
                    "conversation_id": self.conversation_id,
                    "text": "Hello! This is a test message from the backend testing suite."
                }
                
                response = requests.post(f"{self.base_url}/messages", 
                                       json=message_data, headers=user1_headers)
                
                if response.status_code == 201:
                    message = response.json()
                    required_fields = ['id', 'conversation_id', 'sender_id', 'text', 'created_at']
                    
                    if all(field in message for field in required_fields):
                        self.message_id = message['id']
                        self.log_test("Send message", "PASS", f"Message sent: {message['id']}")
                    else:
                        self.log_test("Send message", "FAIL", "Missing required fields in message")
                else:
                    self.log_test("Send message", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("Send message", "FAIL", "No conversation available")
        except Exception as e:
            self.log_test("Send message", "FAIL", str(e))
    
    def test_get_messages(self):
        """Test getting messages for conversation"""
        try:
            user1_headers = self.get_auth_headers("videouser")
            
            if hasattr(self, 'conversation_id'):
                response = requests.get(f"{self.base_url}/messages/{self.conversation_id}", 
                                      headers=user1_headers)
                
                if response.status_code == 200:
                    messages = response.json()
                    
                    if isinstance(messages, list):
                        if len(messages) > 0:
                            message = messages[0]
                            required_fields = ['id', 'sender_id', 'text', 'created_at']
                            
                            if all(field in message for field in required_fields):
                                self.log_test("Get messages", "PASS", f"Retrieved {len(messages)} messages")
                            else:
                                self.log_test("Get messages", "FAIL", "Missing required fields in message")
                        else:
                            self.log_test("Get messages", "PASS", "Messages endpoint working (empty)")
                    else:
                        self.log_test("Get messages", "FAIL", "Response is not a list")
                else:
                    self.log_test("Get messages", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("Get messages", "FAIL", "No conversation available")
        except Exception as e:
            self.log_test("Get messages", "FAIL", str(e))
    
    def test_get_conversations_with_unread_counts(self):
        """Test getting conversations with unread counts"""
        try:
            user1_headers = self.get_auth_headers("videouser")
            
            response = requests.get(f"{self.base_url}/messages/conversations", headers=user1_headers)
            
            if response.status_code == 200:
                conversations = response.json()
                
                if isinstance(conversations, list):
                    if len(conversations) > 0:
                        conversation = conversations[0]
                        required_fields = ['id', 'participants', 'participant_info', 'unread_count']
                        
                        if all(field in conversation for field in required_fields):
                            self.log_test("Get conversations with unread counts", "PASS", 
                                        f"Retrieved {len(conversations)} conversations")
                        else:
                            self.log_test("Get conversations with unread counts", "FAIL", 
                                        "Missing required fields")
                    else:
                        self.log_test("Get conversations with unread counts", "PASS", 
                                    "Conversations endpoint working (empty)")
                else:
                    self.log_test("Get conversations with unread counts", "FAIL", "Response is not a list")
            else:
                self.log_test("Get conversations with unread counts", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get conversations with unread counts", "FAIL", str(e))
    
    def test_mark_conversation_as_read(self):
        """Test marking conversation as read"""
        try:
            user2_headers = self.get_auth_headers("storyuser")
            
            if hasattr(self, 'conversation_id'):
                response = requests.put(f"{self.base_url}/messages/{self.conversation_id}/read", 
                                      headers=user2_headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'message' in data:
                        self.log_test("Mark conversation as read", "PASS", "Messages marked as read")
                    else:
                        self.log_test("Mark conversation as read", "FAIL", "No message in response")
                else:
                    self.log_test("Mark conversation as read", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("Mark conversation as read", "FAIL", "No conversation available")
        except Exception as e:
            self.log_test("Mark conversation as read", "FAIL", str(e))
    
    def test_websocket_server_availability(self):
        """Test if WebSocket server is available"""
        try:
            # Test if the server responds to HTTP requests (Socket.IO endpoint)
            response = requests.get("https://social-enhance.preview.emergentagent.com/socket.io/")
            
            if response.status_code in [200, 400]:  # 400 is expected for Socket.IO without proper handshake
                self.log_test("WebSocket server availability", "PASS", "Socket.IO server is responding")
            else:
                self.log_test("WebSocket server availability", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("WebSocket server availability", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting SocialVibe Backend Testing Suite - Phase 2 & 3")
        print("=" * 60)
        
        # Setup
        print("\n📋 Setting up test environment...")
        self.create_test_users()
        
        # Video Upload and Posts Tests
        print("\n🎥 Testing Video Upload and Posts Backend...")
        self.test_video_upload_endpoint()
        self.test_video_upload_size_limit()
        self.test_video_format_validation()
        self.test_create_post_with_video()
        self.test_video_posts_in_feed()
        
        # Stories Tests
        print("\n📸 Testing Stories Backend with 24h Expiry...")
        self.test_story_media_upload()
        self.test_create_image_story()
        self.test_create_video_story()
        self.test_get_stories_with_view_status()
        self.test_view_story_tracking()
        self.test_delete_own_story()
        self.test_cleanup_expired_stories()
        
        # Direct Messaging Tests
        print("\n💬 Testing Direct Messaging Backend with WebSocket...")
        self.test_create_conversation()
        self.test_send_message()
        self.test_get_messages()
        self.test_get_conversations_with_unread_counts()
        self.test_mark_conversation_as_read()
        self.test_websocket_server_availability()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        total = len(self.test_results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/total)*100:.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = SocialVibeBackendTester()
    results = tester.run_all_tests()