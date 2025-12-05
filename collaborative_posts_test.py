#!/usr/bin/env python3
"""
SocialVibe Backend Testing Suite - Collaborative Posts Feature
Tests Collaborative Posts Creation, Invites, Accept/Reject, Feed Filtering, and Notifications
"""

import requests
import json
import time
import os
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://social-comments-2.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class CollaborativePostsTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.test_users = {}
        self.test_results = []
        self.collaborative_posts = []
        
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
        """Create test users for Collaborative Posts testing"""
        users = [
            {"username": "alice_collab", "email": "alice@collab.com", "password": "password123"},
            {"username": "bob_collab", "email": "bob@collab.com", "password": "password123"},
            {"username": "charlie_collab", "email": "charlie@collab.com", "password": "password123"}
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
    
    # ==================== COLLABORATIVE POSTS CREATION TESTS ====================
    
    def test_create_collaborative_post_success(self):
        """Test POST /api/collaborations/invite - Create collaborative post with invite"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            post_data = {
                "text": "Let's collaborate on this amazing post! 🤝 #collaboration #socialvibe",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            response = requests.post(f"{self.base_url}/collaborations/invite", 
                                   json=post_data, headers=alice_headers)
            
            if response.status_code == 201:
                post = response.json()
                if (post.get('is_collaborative') == True and 
                    post.get('collaboration_status') == 'pending' and
                    post.get('collaborator_username') == bob_username):
                    self.collaborative_posts.append(post['id'])
                    self.log_test("Create collaborative post - Success", "PASS", 
                                f"Collaborative post created with pending status: {post['id']}")
                else:
                    self.log_test("Create collaborative post - Success", "FAIL", 
                                f"Post missing collaborative fields: {post}")
            else:
                self.log_test("Create collaborative post - Success", "FAIL", 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create collaborative post - Success", "FAIL", str(e))
    
    def test_create_collaborative_post_missing_collaborator(self):
        """Test POST /api/collaborations/invite - Missing collaborator_username"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            
            post_data = {
                "text": "This post is missing a collaborator!",
                "visibility": "public"
            }
            
            response = requests.post(f"{self.base_url}/collaborations/invite", 
                                   json=post_data, headers=alice_headers)
            
            if response.status_code == 400:
                self.log_test("Create collaborative post - Missing collaborator", "PASS", 
                            "Correctly rejected missing collaborator_username")
            else:
                self.log_test("Create collaborative post - Missing collaborator", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create collaborative post - Missing collaborator", "FAIL", str(e))
    
    def test_create_collaborative_post_nonexistent_collaborator(self):
        """Test POST /api/collaborations/invite - Non-existent collaborator"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            
            post_data = {
                "text": "Trying to collaborate with non-existent user!",
                "collaborator_username": "nonexistent_user_12345",
                "visibility": "public"
            }
            
            response = requests.post(f"{self.base_url}/collaborations/invite", 
                                   json=post_data, headers=alice_headers)
            
            if response.status_code == 404:
                self.log_test("Create collaborative post - Non-existent collaborator", "PASS", 
                            "Correctly rejected non-existent collaborator")
            else:
                self.log_test("Create collaborative post - Non-existent collaborator", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create collaborative post - Non-existent collaborator", "FAIL", str(e))
    
    def test_create_collaborative_post_self_collaboration(self):
        """Test POST /api/collaborations/invite - Cannot collaborate with self"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            alice_username = self.test_users["alice_collab"]["username"]
            
            post_data = {
                "text": "Trying to collaborate with myself!",
                "collaborator_username": alice_username,
                "visibility": "public"
            }
            
            response = requests.post(f"{self.base_url}/collaborations/invite", 
                                   json=post_data, headers=alice_headers)
            
            if response.status_code == 400:
                self.log_test("Create collaborative post - Self collaboration", "PASS", 
                            "Correctly rejected self-collaboration")
            else:
                self.log_test("Create collaborative post - Self collaboration", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create collaborative post - Self collaboration", "FAIL", str(e))
    
    def test_collab_invite_notification_creation(self):
        """Test that collab_invite notifications are created"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            alice_username = self.test_users["alice_collab"]["username"]
            
            # Get Bob's notifications before invite
            before_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Notification test: Let's collaborate! 🔔 #notification #test",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                # Wait a moment for notification to be created
                time.sleep(1)
                
                # Get Bob's notifications after invite
                after_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    
                    # Look for collab_invite notification
                    collab_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'collab_invite' and 
                            notif.get('actor_username') == alice_username):
                            collab_notification = notif
                            break
                    
                    if collab_notification:
                        required_fields = ['actor_id', 'actor_username', 'type', 'post_id', 'text']
                        if all(field in collab_notification for field in required_fields):
                            self.log_test("Collab invite notification creation", "PASS", 
                                        f"Notification created: {collab_notification['text']}")
                        else:
                            self.log_test("Collab invite notification creation", "FAIL", 
                                        f"Missing required fields: {collab_notification}")
                    else:
                        self.log_test("Collab invite notification creation", "FAIL", 
                                    "No collab_invite notification found")
                else:
                    self.log_test("Collab invite notification creation", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Collab invite notification creation", "FAIL", 
                            f"Failed to create post: {create_response.status_code}")
        except Exception as e:
            self.log_test("Collab invite notification creation", "FAIL", str(e))
    
    # ==================== COLLABORATION ACCEPTANCE TESTS ====================
    
    def test_accept_collaboration_success(self):
        """Test POST /api/collaborations/:postId/accept - Accept collaboration invite"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Accept test: Let's work together! ✅ #accept #collaboration",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob accepts the collaboration
                accept_response = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                              headers=bob_headers)
                
                if accept_response.status_code == 200:
                    updated_post = accept_response.json()
                    if updated_post.get('collaboration_status') == 'accepted':
                        self.log_test("Accept collaboration - Success", "PASS", 
                                    f"Collaboration accepted: {post_id}")
                    else:
                        self.log_test("Accept collaboration - Success", "FAIL", 
                                    f"Status not updated: {updated_post.get('collaboration_status')}")
                else:
                    self.log_test("Accept collaboration - Success", "FAIL", 
                                f"Accept status: {accept_response.status_code}")
            else:
                self.log_test("Accept collaboration - Success", "FAIL", 
                            f"Create status: {create_response.status_code}")
        except Exception as e:
            self.log_test("Accept collaboration - Success", "FAIL", str(e))
    
    def test_accept_collaboration_wrong_user(self):
        """Test POST /api/collaborations/:postId/accept - Wrong user trying to accept"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            charlie_headers = self.get_auth_headers("charlie_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Wrong user test: Only Bob should accept this! 🚫 #wronguser",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Charlie tries to accept (should fail)
                accept_response = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                              headers=charlie_headers)
                
                if accept_response.status_code == 403:
                    self.log_test("Accept collaboration - Wrong user", "PASS", 
                                "Correctly rejected wrong user")
                else:
                    self.log_test("Accept collaboration - Wrong user", "FAIL", 
                                f"Status: {accept_response.status_code}")
            else:
                self.log_test("Accept collaboration - Wrong user", "FAIL", 
                            f"Create status: {create_response.status_code}")
        except Exception as e:
            self.log_test("Accept collaboration - Wrong user", "FAIL", str(e))
    
    def test_accept_collaboration_non_pending(self):
        """Test POST /api/collaborations/:postId/accept - Accept non-pending collaboration"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Non-pending test: Accept once, try again! 🔄 #nonpending",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob accepts the collaboration (first time)
                first_accept = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                           headers=bob_headers)
                
                if first_accept.status_code == 200:
                    # Bob tries to accept again (should fail)
                    second_accept = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                                headers=bob_headers)
                    
                    if second_accept.status_code == 400:
                        self.log_test("Accept collaboration - Non-pending", "PASS", 
                                    "Correctly rejected non-pending collaboration")
                    else:
                        self.log_test("Accept collaboration - Non-pending", "FAIL", 
                                    f"Second accept status: {second_accept.status_code}")
                else:
                    self.log_test("Accept collaboration - Non-pending", "FAIL", 
                                f"First accept failed: {first_accept.status_code}")
            else:
                self.log_test("Accept collaboration - Non-pending", "FAIL", 
                            f"Create status: {create_response.status_code}")
        except Exception as e:
            self.log_test("Accept collaboration - Non-pending", "FAIL", str(e))
    
    def test_collab_accepted_notification_creation(self):
        """Test that collab_accepted notifications are created"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            alice_username = self.test_users["alice_collab"]["username"]
            
            # Get Alice's notifications before acceptance
            before_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Accepted notification test! 🎉 #accepted #notification",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob accepts the collaboration
                accept_response = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                              headers=bob_headers)
                
                if accept_response.status_code == 200:
                    # Wait a moment for notification to be created
                    time.sleep(1)
                    
                    # Get Alice's notifications after acceptance
                    after_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
                    
                    if after_response.status_code == 200:
                        notifications = after_response.json()
                        
                        # Look for collab_accepted notification
                        accepted_notification = None
                        for notif in notifications:
                            if (notif.get('type') == 'collab_accepted' and 
                                notif.get('actor_username') == bob_username):
                                accepted_notification = notif
                                break
                        
                        if accepted_notification:
                            self.log_test("Collab accepted notification creation", "PASS", 
                                        f"Notification created: {accepted_notification['text']}")
                        else:
                            self.log_test("Collab accepted notification creation", "FAIL", 
                                        "No collab_accepted notification found")
                    else:
                        self.log_test("Collab accepted notification creation", "FAIL", 
                                    f"Failed to get notifications: {after_response.status_code}")
                else:
                    self.log_test("Collab accepted notification creation", "FAIL", 
                                f"Accept failed: {accept_response.status_code}")
            else:
                self.log_test("Collab accepted notification creation", "FAIL", 
                            f"Create failed: {create_response.status_code}")
        except Exception as e:
            self.log_test("Collab accepted notification creation", "FAIL", str(e))
    
    # ==================== COLLABORATION REJECTION TESTS ====================
    
    def test_reject_collaboration_success(self):
        """Test POST /api/collaborations/:postId/reject - Reject collaboration invite"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Reject test: This will be rejected! ❌ #reject #collaboration",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob rejects the collaboration
                reject_response = requests.post(f"{self.base_url}/collaborations/{post_id}/reject", 
                                              headers=bob_headers)
                
                if reject_response.status_code == 200:
                    # Verify post is converted to regular post
                    alice_username = self.test_users["alice_collab"]["username"]
                    post_response = requests.get(f"{self.base_url}/posts/user/{alice_username}", 
                                               headers=alice_headers)
                    
                    if post_response.status_code == 200:
                        posts = post_response.json()
                        rejected_post = next((p for p in posts if p['id'] == post_id), None)
                        
                        if (rejected_post and 
                            rejected_post.get('is_collaborative') == False and
                            rejected_post.get('collaborator_id') is None):
                            self.log_test("Reject collaboration - Success", "PASS", 
                                        f"Post converted to regular post: {post_id}")
                        else:
                            self.log_test("Reject collaboration - Success", "FAIL", 
                                        f"Post not properly converted: {rejected_post}")
                    else:
                        self.log_test("Reject collaboration - Success", "FAIL", 
                                    f"Failed to get post: {post_response.status_code}")
                else:
                    self.log_test("Reject collaboration - Success", "FAIL", 
                                f"Reject status: {reject_response.status_code}")
            else:
                self.log_test("Reject collaboration - Success", "FAIL", 
                            f"Create status: {create_response.status_code}")
        except Exception as e:
            self.log_test("Reject collaboration - Success", "FAIL", str(e))
    
    def test_reject_collaboration_wrong_user(self):
        """Test POST /api/collaborations/:postId/reject - Wrong user trying to reject"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            charlie_headers = self.get_auth_headers("charlie_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Wrong reject test: Only Bob should reject this! 🚫 #wrongreject",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Charlie tries to reject (should fail)
                reject_response = requests.post(f"{self.base_url}/collaborations/{post_id}/reject", 
                                              headers=charlie_headers)
                
                if reject_response.status_code == 403:
                    self.log_test("Reject collaboration - Wrong user", "PASS", 
                                "Correctly rejected wrong user")
                else:
                    self.log_test("Reject collaboration - Wrong user", "FAIL", 
                                f"Status: {reject_response.status_code}")
            else:
                self.log_test("Reject collaboration - Wrong user", "FAIL", 
                            f"Create status: {create_response.status_code}")
        except Exception as e:
            self.log_test("Reject collaboration - Wrong user", "FAIL", str(e))
    
    # ==================== PENDING COLLABORATIONS TESTS ====================
    
    def test_get_pending_collaborations(self):
        """Test GET /api/collaborations/pending - Get pending collaboration invites"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Pending test: This should appear in Bob's pending list! 📋 #pending",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob gets his pending collaborations
                pending_response = requests.get(f"{self.base_url}/collaborations/pending", 
                                              headers=bob_headers)
                
                if pending_response.status_code == 200:
                    pending_posts = pending_response.json()
                    
                    # Check if the created post is in pending list
                    found_post = next((p for p in pending_posts if p['id'] == post_id), None)
                    
                    if found_post and found_post.get('collaboration_status') == 'pending':
                        self.log_test("Get pending collaborations", "PASS", 
                                    f"Found pending collaboration: {post_id}")
                    else:
                        self.log_test("Get pending collaborations", "FAIL", 
                                    f"Post not found in pending list: {pending_posts}")
                else:
                    self.log_test("Get pending collaborations", "FAIL", 
                                f"Status: {pending_response.status_code}")
            else:
                self.log_test("Get pending collaborations", "FAIL", 
                            f"Create status: {create_response.status_code}")
        except Exception as e:
            self.log_test("Get pending collaborations", "FAIL", str(e))
    
    # ==================== FEED AND PROFILE FILTERING TESTS ====================
    
    def test_feed_shows_accepted_collaborative_posts(self):
        """Test GET /api/posts/feed - Shows accepted collaborative posts"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            charlie_headers = self.get_auth_headers("charlie_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            alice_user_id = self.test_users["alice_collab"]["user_id"]
            
            # Charlie follows Alice to see her posts
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=charlie_headers)
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Feed test: This should appear in both Alice and Bob's feeds after acceptance! 📰 #feed",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob accepts the collaboration
                accept_response = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                              headers=bob_headers)
                
                if accept_response.status_code == 200:
                    # Check Alice's feed (should see the post)
                    alice_feed = requests.get(f"{self.base_url}/posts/feed", headers=alice_headers)
                    
                    if alice_feed.status_code == 200:
                        alice_posts = alice_feed.json()
                        alice_has_post = any(p.get('id') == post_id for p in alice_posts)
                        
                        # Check Bob's feed (should see the post)
                        bob_feed = requests.get(f"{self.base_url}/posts/feed", headers=bob_headers)
                        
                        if bob_feed.status_code == 200:
                            bob_posts = bob_feed.json()
                            bob_has_post = any(p.get('id') == post_id for p in bob_posts)
                            
                            if alice_has_post and bob_has_post:
                                self.log_test("Feed shows accepted collaborative posts", "PASS", 
                                            "Both collaborators see the post in their feeds")
                            else:
                                self.log_test("Feed shows accepted collaborative posts", "FAIL", 
                                            f"Alice sees: {alice_has_post}, Bob sees: {bob_has_post}")
                        else:
                            self.log_test("Feed shows accepted collaborative posts", "FAIL", 
                                        f"Bob feed status: {bob_feed.status_code}")
                    else:
                        self.log_test("Feed shows accepted collaborative posts", "FAIL", 
                                    f"Alice feed status: {alice_feed.status_code}")
                else:
                    self.log_test("Feed shows accepted collaborative posts", "FAIL", 
                                f"Accept failed: {accept_response.status_code}")
            else:
                self.log_test("Feed shows accepted collaborative posts", "FAIL", 
                            f"Create failed: {create_response.status_code}")
        except Exception as e:
            self.log_test("Feed shows accepted collaborative posts", "FAIL", str(e))
    
    def test_profile_shows_collaborative_posts(self):
        """Test GET /api/posts/user/:username - Shows collaborative posts in both profiles"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            charlie_headers = self.get_auth_headers("charlie_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            alice_username = self.test_users["alice_collab"]["username"]
            
            # Alice creates collaborative post with Bob
            post_data = {
                "text": "Profile test: This should appear in both Alice and Bob's profiles! 👤 #profile",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Bob accepts the collaboration
                accept_response = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                              headers=bob_headers)
                
                if accept_response.status_code == 200:
                    # Check Alice's profile (should see the post)
                    alice_profile = requests.get(f"{self.base_url}/posts/user/{alice_username}", 
                                               headers=charlie_headers)
                    
                    if alice_profile.status_code == 200:
                        alice_posts = alice_profile.json()
                        alice_has_post = any(p.get('id') == post_id for p in alice_posts)
                        
                        # Check Bob's profile (should see the post)
                        bob_profile = requests.get(f"{self.base_url}/posts/user/{bob_username}", 
                                                 headers=charlie_headers)
                        
                        if bob_profile.status_code == 200:
                            bob_posts = bob_profile.json()
                            bob_has_post = any(p.get('id') == post_id for p in bob_posts)
                            
                            if alice_has_post and bob_has_post:
                                self.log_test("Profile shows collaborative posts", "PASS", 
                                            "Post appears in both collaborators' profiles")
                            else:
                                self.log_test("Profile shows collaborative posts", "FAIL", 
                                            f"Alice profile: {alice_has_post}, Bob profile: {bob_has_post}")
                        else:
                            self.log_test("Profile shows collaborative posts", "FAIL", 
                                        f"Bob profile status: {bob_profile.status_code}")
                    else:
                        self.log_test("Profile shows collaborative posts", "FAIL", 
                                    f"Alice profile status: {alice_profile.status_code}")
                else:
                    self.log_test("Profile shows collaborative posts", "FAIL", 
                                f"Accept failed: {accept_response.status_code}")
            else:
                self.log_test("Profile shows collaborative posts", "FAIL", 
                            f"Create failed: {create_response.status_code}")
        except Exception as e:
            self.log_test("Profile shows collaborative posts", "FAIL", str(e))
    
    def test_pending_posts_not_in_collaborator_profile(self):
        """Test that pending collaborative posts don't appear in collaborator's profile"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            charlie_headers = self.get_auth_headers("charlie_collab")
            bob_username = self.test_users["bob_collab"]["username"]
            
            # Alice creates collaborative post with Bob (but Bob doesn't accept)
            post_data = {
                "text": "Pending profile test: This should NOT appear in Bob's profile! 🚫 #pending #profile",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                post = create_response.json()
                post_id = post['id']
                
                # Check Bob's profile (should NOT see the pending post)
                bob_profile = requests.get(f"{self.base_url}/posts/user/{bob_username}", 
                                         headers=charlie_headers)
                
                if bob_profile.status_code == 200:
                    bob_posts = bob_profile.json()
                    bob_has_post = any(p.get('id') == post_id for p in bob_posts)
                    
                    if not bob_has_post:
                        self.log_test("Pending posts not in collaborator profile", "PASS", 
                                    "Pending post correctly hidden from collaborator's profile")
                    else:
                        self.log_test("Pending posts not in collaborator profile", "FAIL", 
                                    "Pending post appears in collaborator's profile")
                else:
                    self.log_test("Pending posts not in collaborator profile", "FAIL", 
                                f"Bob profile status: {bob_profile.status_code}")
            else:
                self.log_test("Pending posts not in collaborator profile", "FAIL", 
                            f"Create failed: {create_response.status_code}")
        except Exception as e:
            self.log_test("Pending posts not in collaborator profile", "FAIL", str(e))
    
    # ==================== COMPLETE WORKFLOW TEST ====================
    
    def test_complete_collaborative_workflow(self):
        """Test complete Collaborative Posts workflow: Create -> Accept -> Verify feeds/profiles"""
        try:
            alice_headers = self.get_auth_headers("alice_collab")
            bob_headers = self.get_auth_headers("bob_collab")
            charlie_headers = self.get_auth_headers("charlie_collab")
            
            alice_username = self.test_users["alice_collab"]["username"]
            bob_username = self.test_users["bob_collab"]["username"]
            alice_user_id = self.test_users["alice_collab"]["user_id"]
            
            # Charlie follows Alice to see her posts
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=charlie_headers)
            
            # Step 1: Alice creates collaborative post with Bob
            post_data = {
                "text": "Complete workflow test: From creation to acceptance! 🔄 #workflow #complete",
                "collaborator_username": bob_username,
                "visibility": "public"
            }
            
            create_response = requests.post(f"{self.base_url}/collaborations/invite", 
                                          json=post_data, headers=alice_headers)
            
            if create_response.status_code != 201:
                self.log_test("Complete workflow - Create step", "FAIL", 
                            f"Create failed: {create_response.status_code}")
                return
            
            post = create_response.json()
            post_id = post['id']
            
            # Step 2: Verify post is pending
            if post.get('collaboration_status') != 'pending':
                self.log_test("Complete workflow - Pending status", "FAIL", 
                            f"Status not pending: {post.get('collaboration_status')}")
                return
            
            # Step 3: Verify Bob gets notification
            time.sleep(1)
            notifications = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
            if notifications.status_code == 200:
                notifs = notifications.json()
                collab_notif = any(n.get('type') == 'collab_invite' and n.get('post_id') == post_id 
                                 for n in notifs)
                if not collab_notif:
                    self.log_test("Complete workflow - Notification", "FAIL", 
                                "No collab_invite notification found")
                    return
            
            # Step 4: Verify post appears in Bob's pending list
            pending_response = requests.get(f"{self.base_url}/collaborations/pending", headers=bob_headers)
            if pending_response.status_code == 200:
                pending_posts = pending_response.json()
                if not any(p.get('id') == post_id for p in pending_posts):
                    self.log_test("Complete workflow - Pending list", "FAIL", 
                                "Post not in Bob's pending list")
                    return
            
            # Step 5: Bob accepts the collaboration
            accept_response = requests.post(f"{self.base_url}/collaborations/{post_id}/accept", 
                                          headers=bob_headers)
            
            if accept_response.status_code != 200:
                self.log_test("Complete workflow - Accept step", "FAIL", 
                            f"Accept failed: {accept_response.status_code}")
                return
            
            # Step 6: Verify Alice gets acceptance notification
            time.sleep(1)
            alice_notifications = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
            if alice_notifications.status_code == 200:
                alice_notifs = alice_notifications.json()
                accepted_notif = any(n.get('type') == 'collab_accepted' and n.get('post_id') == post_id 
                                   for n in alice_notifs)
                if not accepted_notif:
                    self.log_test("Complete workflow - Acceptance notification", "FAIL", 
                                "No collab_accepted notification found")
                    return
            
            # Step 7: Verify post appears in both feeds
            alice_feed = requests.get(f"{self.base_url}/posts/feed", headers=alice_headers).json()
            bob_feed = requests.get(f"{self.base_url}/posts/feed", headers=bob_headers).json()
            
            alice_has_post = any(p.get('id') == post_id for p in alice_feed)
            bob_has_post = any(p.get('id') == post_id for p in bob_feed)
            
            if not alice_has_post or not bob_has_post:
                self.log_test("Complete workflow - Feed visibility", "FAIL", 
                            f"Alice feed: {alice_has_post}, Bob feed: {bob_has_post}")
                return
            
            # Step 8: Verify post appears in both profiles
            alice_profile = requests.get(f"{self.base_url}/posts/user/{alice_username}", 
                                       headers=charlie_headers).json()
            bob_profile = requests.get(f"{self.base_url}/posts/user/{bob_username}", 
                                     headers=charlie_headers).json()
            
            alice_profile_has_post = any(p.get('id') == post_id for p in alice_profile)
            bob_profile_has_post = any(p.get('id') == post_id for p in bob_profile)
            
            if alice_profile_has_post and bob_profile_has_post:
                self.log_test("Complete Collaborative Posts workflow", "PASS", 
                            "Full workflow successful: Create -> Notify -> Accept -> Feeds -> Profiles")
            else:
                self.log_test("Complete Collaborative Posts workflow", "FAIL", 
                            f"Profile visibility - Alice: {alice_profile_has_post}, Bob: {bob_profile_has_post}")
                
        except Exception as e:
            self.log_test("Complete Collaborative Posts workflow", "FAIL", str(e))
    
    # ==================== HELPER METHODS ====================
    
    def setup_test_follows(self):
        """Helper method to set up follow relationships for testing"""
        try:
            alice_user_id = self.test_users["alice_collab"]["user_id"]
            bob_user_id = self.test_users["bob_collab"]["user_id"]
            charlie_headers = self.get_auth_headers("charlie_collab")
            
            # Charlie follows Alice and Bob to see their posts in feed
            requests.post(f"{self.base_url}/users/{alice_user_id}/follow", headers=charlie_headers)
            requests.post(f"{self.base_url}/users/{bob_user_id}/follow", headers=charlie_headers)
        except Exception as e:
            print(f"Warning: Failed to set up follows: {e}")
    
    def run_all_tests(self):
        """Run all Collaborative Posts backend tests"""
        print("🚀 Starting SocialVibe Backend Testing Suite - Collaborative Posts Feature")
        print("=" * 80)
        
        # Setup
        print("\n📋 Setting up test environment...")
        self.create_test_users()
        self.setup_test_follows()
        
        # Collaborative Posts Creation Tests
        print("\n🤝 Testing Collaborative Posts Creation...")
        self.test_create_collaborative_post_success()
        self.test_create_collaborative_post_missing_collaborator()
        self.test_create_collaborative_post_nonexistent_collaborator()
        self.test_create_collaborative_post_self_collaboration()
        self.test_collab_invite_notification_creation()
        
        # Collaboration Acceptance Tests
        print("\n✅ Testing Collaboration Acceptance...")
        self.test_accept_collaboration_success()
        self.test_accept_collaboration_wrong_user()
        self.test_accept_collaboration_non_pending()
        self.test_collab_accepted_notification_creation()
        
        # Collaboration Rejection Tests
        print("\n❌ Testing Collaboration Rejection...")
        self.test_reject_collaboration_success()
        self.test_reject_collaboration_wrong_user()
        
        # Pending Collaborations Tests
        print("\n📋 Testing Pending Collaborations...")
        self.test_get_pending_collaborations()
        
        # Feed and Profile Filtering Tests
        print("\n🔍 Testing Feed and Profile Filtering...")
        self.test_feed_shows_accepted_collaborative_posts()
        self.test_profile_shows_collaborative_posts()
        self.test_pending_posts_not_in_collaborator_profile()
        
        # Complete Workflow Test
        print("\n🔄 Testing Complete Workflow...")
        self.test_complete_collaborative_workflow()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COLLABORATIVE POSTS TESTING SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        total = len(self.test_results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/total)*100:.1f}%")
        
        # Categorize results
        creation_tests = [r for r in self.test_results if 'create' in r['test'].lower() or 'invite' in r['test'].lower()]
        acceptance_tests = [r for r in self.test_results if 'accept' in r['test'].lower()]
        rejection_tests = [r for r in self.test_results if 'reject' in r['test'].lower()]
        pending_tests = [r for r in self.test_results if 'pending' in r['test'].lower()]
        filtering_tests = [r for r in self.test_results if 'feed' in r['test'].lower() or 'profile' in r['test'].lower()]
        workflow_tests = [r for r in self.test_results if 'workflow' in r['test'].lower()]
        
        print(f"\n📊 BREAKDOWN:")
        print(f"   🤝 Creation: {len([r for r in creation_tests if r['status'] == 'PASS'])}/{len(creation_tests)} passed")
        print(f"   ✅ Acceptance: {len([r for r in acceptance_tests if r['status'] == 'PASS'])}/{len(acceptance_tests)} passed")
        print(f"   ❌ Rejection: {len([r for r in rejection_tests if r['status'] == 'PASS'])}/{len(rejection_tests)} passed")
        print(f"   📋 Pending: {len([r for r in pending_tests if r['status'] == 'PASS'])}/{len(pending_tests)} passed")
        print(f"   🔍 Filtering: {len([r for r in filtering_tests if r['status'] == 'PASS'])}/{len(filtering_tests)} passed")
        print(f"   🔄 Workflow: {len([r for r in workflow_tests if r['status'] == 'PASS'])}/{len(workflow_tests)} passed")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = CollaborativePostsTester()
    results = tester.run_all_tests()