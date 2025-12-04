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
BASE_URL = "https://mention-tag-boost.preview.emergentagent.com/api"
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
                        token = token_data.get("access_token")
                        
                        # Get user info using the token
                        me_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
                        me_response = requests.get(f"{self.base_url}/auth/me", headers=me_headers)
                        
                        if me_response.status_code == 200:
                            user_info = me_response.json()
                            self.test_users[user_data["username"]] = {
                                "token": token,
                                "user_id": user_info.get("id"),
                                "username": user_data["username"]
                            }
                            self.log_test(f"Create user {user_data['username']}", "PASS")
                        else:
                            self.log_test(f"Get user info {user_data['username']}", "FAIL", f"Status: {me_response.status_code}")
                    else:
                        self.log_test(f"Login user {user_data['username']}", "FAIL", f"Status: {login_response.status_code}")
                elif response.status_code == 400 and ("already" in response.text.lower() or "registered" in response.text.lower()):
                    # User exists, try to login
                    login_response = requests.post(f"{self.base_url}/auth/login", json={
                        "username": user_data["username"],
                        "password": user_data["password"]
                    })
                    if login_response.status_code == 200:
                        token_data = login_response.json()
                        token = token_data.get("access_token")
                        
                        # Get user info using the token
                        me_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
                        me_response = requests.get(f"{self.base_url}/auth/me", headers=me_headers)
                        
                        if me_response.status_code == 200:
                            user_info = me_response.json()
                            self.test_users[user_data["username"]] = {
                                "token": token,
                                "user_id": user_info.get("id"),
                                "username": user_data["username"]
                            }
                            self.log_test(f"Login existing user {user_data['username']}", "PASS")
                        else:
                            self.log_test(f"Get user info {user_data['username']}", "FAIL", f"Status: {me_response.status_code}")
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
            
            # First, ensure Bob is not in close friends (remove if exists)
            requests.delete(f"{self.base_url}/users/close-friends/remove", 
                          json={"user_id": bob_user_id}, headers=alice_headers)
            
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
    
    def test_user_profile_visibility_filtering(self):
        """Test GET /api/posts/user/:username - Profile shows posts based on visibility"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_headers = self.get_auth_headers("bob_cf")
            charlie_headers = self.get_auth_headers("charlie_cf")
            alice_username = self.test_users["alice_cf"]["username"]
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            
            # Alice adds Bob to close friends
            requests.post(f"{self.base_url}/users/close-friends/add", 
                         json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Alice creates both public and close friends posts
            public_post = {
                "text": "Alice's public post on her profile! 📝 #public #profile",
                "visibility": "public"
            }
            
            close_friends_post = {
                "text": "Alice's close friends post on her profile! 🔒 #closefriends #profile",
                "visibility": "close_friends"
            }
            
            public_response = requests.post(f"{self.base_url}/posts", json=public_post, headers=alice_headers)
            close_friends_response = requests.post(f"{self.base_url}/posts", json=close_friends_post, headers=alice_headers)
            
            if public_response.status_code == 201 and close_friends_response.status_code == 201:
                public_post_id = public_response.json()['id']
                close_friends_post_id = close_friends_response.json()['id']
                
                # Bob (close friend) should see both posts on Alice's profile
                bob_view_response = requests.get(f"{self.base_url}/posts/user/{alice_username}", headers=bob_headers)
                
                if bob_view_response.status_code == 200:
                    bob_view_posts = bob_view_response.json()
                    
                    public_found = any(p.get('id') == public_post_id for p in bob_view_posts)
                    close_friends_found = any(p.get('id') == close_friends_post_id for p in bob_view_posts)
                    
                    if public_found and close_friends_found:
                        self.log_test("Profile visibility - Close friend sees all", "PASS", "Bob sees both public and close friends posts")
                    else:
                        self.log_test("Profile visibility - Close friend sees all", "FAIL", f"Bob missing posts: public={public_found}, close_friends={close_friends_found}")
                else:
                    self.log_test("Profile visibility - Close friend sees all", "FAIL", f"Bob profile view status: {bob_view_response.status_code}")
                
                # Charlie (not close friend) should only see public post
                charlie_view_response = requests.get(f"{self.base_url}/posts/user/{alice_username}", headers=charlie_headers)
                
                if charlie_view_response.status_code == 200:
                    charlie_view_posts = charlie_view_response.json()
                    
                    public_found = any(p.get('id') == public_post_id for p in charlie_view_posts)
                    close_friends_found = any(p.get('id') == close_friends_post_id for p in charlie_view_posts)
                    
                    if public_found and not close_friends_found:
                        self.log_test("Profile visibility - Non-close friend sees public only", "PASS", "Charlie sees only public post")
                    else:
                        self.log_test("Profile visibility - Non-close friend sees public only", "FAIL", f"Charlie sees: public={public_found}, close_friends={close_friends_found}")
                else:
                    self.log_test("Profile visibility - Non-close friend sees public only", "FAIL", f"Charlie profile view status: {charlie_view_response.status_code}")
            else:
                self.log_test("Profile visibility filtering", "FAIL", "Post creation failed")
        except Exception as e:
            self.log_test("Profile visibility filtering", "FAIL", str(e))
    
    def test_close_friend_notification_creation(self):
        """Test that close_friend notifications are created when adding to close friends"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_headers = self.get_auth_headers("bob_cf")
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            alice_username = self.test_users["alice_cf"]["username"]
            
            # First, ensure Bob is not in close friends (remove if exists)
            requests.delete(f"{self.base_url}/users/close-friends/remove", 
                          json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Get Bob's notifications before adding to close friends
            before_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Alice adds Bob to close friends
            add_response = requests.post(f"{self.base_url}/users/close-friends/add", 
                                       json={"user_id": bob_user_id}, headers=alice_headers)
            
            if add_response.status_code == 200:
                # Wait a moment for notification to be created
                time.sleep(1)
                
                # Get Bob's notifications after adding to close friends
                after_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    after_count = len(notifications)
                    
                    # Look for close_friend notification
                    close_friend_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'close_friend' and 
                            notif.get('actor_username') == alice_username):
                            close_friend_notification = notif
                            break
                    
                    if close_friend_notification:
                        required_fields = ['actor_id', 'actor_username', 'type', 'text']
                        if all(field in close_friend_notification for field in required_fields):
                            self.log_test("Close friend notification creation", "PASS", 
                                        f"Notification created with correct structure: {close_friend_notification['text']}")
                        else:
                            self.log_test("Close friend notification creation", "FAIL", 
                                        f"Missing required fields in notification: {close_friend_notification}")
                    else:
                        self.log_test("Close friend notification creation", "FAIL", 
                                    f"No close_friend notification found. Before: {before_count}, After: {after_count}")
                else:
                    self.log_test("Close friend notification creation", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Close friend notification creation", "FAIL", 
                            f"Failed to add close friend: {add_response.status_code}")
        except Exception as e:
            self.log_test("Close friend notification creation", "FAIL", str(e))
    
    # ==================== CLOSE FRIENDS WORKFLOW TEST ====================
    
    def test_complete_close_friends_workflow(self):
        """Test complete Close Friends workflow: Add -> Create post -> View -> Remove -> Verify"""
        try:
            alice_headers = self.get_auth_headers("alice_cf")
            bob_headers = self.get_auth_headers("bob_cf")
            charlie_headers = self.get_auth_headers("charlie_cf")
            
            alice_user_id = self.test_users["alice_cf"]["user_id"]
            bob_user_id = self.test_users["bob_cf"]["user_id"]
            charlie_user_id = self.test_users["charlie_cf"]["user_id"]
            
            # Step 0: Ensure Bob is not in close friends initially (remove if exists)
            requests.delete(f"{self.base_url}/users/close-friends/remove", 
                          json={"user_id": bob_user_id}, headers=alice_headers)
            
            # Step 1: Alice adds Bob to close friends
            add_response = requests.post(f"{self.base_url}/users/close-friends/add", 
                                       json={"user_id": bob_user_id}, headers=alice_headers)
            
            if add_response.status_code != 200:
                self.log_test("Complete workflow - Add step", "FAIL", f"Add failed: {add_response.status_code}")
                return
            
            # Step 2: Bob and Charlie follow Alice
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=bob_headers)
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=charlie_headers)
            
            # Step 3: Alice creates a close friends post
            close_friends_post = {
                "text": "Workflow test: This is for close friends only! 🔒 #workflow #test",
                "visibility": "close_friends"
            }
            
            post_response = requests.post(f"{self.base_url}/posts", json=close_friends_post, headers=alice_headers)
            
            if post_response.status_code != 201:
                self.log_test("Complete workflow - Post creation", "FAIL", f"Post creation failed: {post_response.status_code}")
                return
            
            post_id = post_response.json()['id']
            
            # Step 4: Verify Bob can see the post, Charlie cannot
            bob_feed = requests.get(f"{self.base_url}/posts/feed", headers=bob_headers).json()
            charlie_feed = requests.get(f"{self.base_url}/posts/feed", headers=charlie_headers).json()
            
            bob_can_see = any(p.get('id') == post_id for p in bob_feed)
            charlie_can_see = any(p.get('id') == post_id for p in charlie_feed)
            
            if not bob_can_see:
                self.log_test("Complete workflow - Bob visibility", "FAIL", "Bob cannot see close friends post")
                return
            
            if charlie_can_see:
                self.log_test("Complete workflow - Charlie visibility", "FAIL", "Charlie can see close friends post (should not)")
                return
            
            # Step 5: Alice removes Bob from close friends
            remove_response = requests.delete(f"{self.base_url}/users/close-friends/remove", 
                                            json={"user_id": bob_user_id}, headers=alice_headers)
            
            if remove_response.status_code != 200:
                self.log_test("Complete workflow - Remove step", "FAIL", f"Remove failed: {remove_response.status_code}")
                return
            
            # Step 6: Verify Bob can no longer see close friends posts in new feed requests
            # (Note: Existing posts might still be cached, but new requests should filter them out)
            time.sleep(1)  # Brief pause
            bob_feed_after = requests.get(f"{self.base_url}/posts/feed", headers=bob_headers).json()
            bob_can_see_after = any(p.get('id') == post_id for p in bob_feed_after)
            
            if not bob_can_see_after:
                self.log_test("Complete Close Friends workflow", "PASS", 
                            "Full workflow successful: Add -> Post -> View -> Remove -> Verify")
            else:
                self.log_test("Complete Close Friends workflow", "FAIL", 
                            "Bob can still see close friends post after removal")
                
        except Exception as e:
            self.log_test("Complete Close Friends workflow", "FAIL", str(e))
    
    # ==================== HELPER METHODS ====================
    
    def setup_test_follows(self):
        """Helper method to set up follow relationships for testing"""
        try:
            alice_user_id = self.test_users["alice_cf"]["user_id"]
            bob_headers = self.get_auth_headers("bob_cf")
            charlie_headers = self.get_auth_headers("charlie_cf")
            
            # Bob and Charlie follow Alice to see her posts in feed
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=bob_headers)
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=charlie_headers)
        except Exception as e:
            print(f"Warning: Failed to set up follows: {e}")
    
    def run_all_tests(self):
        """Run all Close Friends backend tests"""
        print("🚀 Starting SocialVibe Backend Testing Suite - Close Friends Feature")
        print("=" * 70)
        
        # Setup
        print("\n📋 Setting up test environment...")
        self.create_test_users()
        self.setup_test_follows()
        
        # Close Friends Management Tests
        print("\n👥 Testing Close Friends Management...")
        self.test_add_close_friend_success()
        self.test_add_close_friend_missing_user_id()
        self.test_add_close_friend_nonexistent_user()
        self.test_add_close_friend_self()
        self.test_add_close_friend_duplicate()
        
        print("\n🗑️ Testing Close Friends Removal...")
        self.test_remove_close_friend_success()
        self.test_remove_close_friend_missing_user_id()
        self.test_remove_close_friend_not_in_list()
        
        print("\n📋 Testing Close Friends List & Status...")
        self.test_get_close_friends_list()
        self.test_check_is_close_friend()
        
        # Post Visibility Tests
        print("\n📝 Testing Post Visibility...")
        self.test_create_post_with_visibility()
        self.test_edit_post_visibility()
        
        # Feed Filtering Tests
        print("\n🔍 Testing Feed Filtering...")
        self.test_feed_filtering_close_friends()
        self.test_author_can_see_own_close_friends_posts()
        self.test_explore_shows_only_public_posts()
        self.test_user_profile_visibility_filtering()
        
        # Notification Tests
        print("\n🔔 Testing Notifications...")
        self.test_close_friend_notification_creation()
        
        # Complete Workflow Test
        print("\n🔄 Testing Complete Workflow...")
        self.test_complete_close_friends_workflow()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 CLOSE FRIENDS TESTING SUMMARY")
        print("=" * 70)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        total = len(self.test_results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/total)*100:.1f}%")
        
        # Categorize results
        management_tests = [r for r in self.test_results if 'close friend' in r['test'].lower() and ('add' in r['test'].lower() or 'remove' in r['test'].lower() or 'list' in r['test'].lower() or 'check' in r['test'].lower())]
        visibility_tests = [r for r in self.test_results if 'post' in r['test'].lower() or 'visibility' in r['test'].lower() or 'feed' in r['test'].lower() or 'explore' in r['test'].lower() or 'profile' in r['test'].lower()]
        notification_tests = [r for r in self.test_results if 'notification' in r['test'].lower()]
        workflow_tests = [r for r in self.test_results if 'workflow' in r['test'].lower()]
        
        print(f"\n📊 BREAKDOWN:")
        print(f"   👥 Management: {len([r for r in management_tests if r['status'] == 'PASS'])}/{len(management_tests)} passed")
        print(f"   🔍 Visibility: {len([r for r in visibility_tests if r['status'] == 'PASS'])}/{len(visibility_tests)} passed")
        print(f"   🔔 Notifications: {len([r for r in notification_tests if r['status'] == 'PASS'])}/{len(notification_tests)} passed")
        print(f"   🔄 Workflow: {len([r for r in workflow_tests if r['status'] == 'PASS'])}/{len(workflow_tests)} passed")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = SocialVibeBackendTester()
    results = tester.run_all_tests()