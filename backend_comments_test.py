#!/usr/bin/env python3
"""
SocialVibe Backend Testing Suite - Comments + Replies System
Tests Comment CRUD operations, Likes, Notifications, and Real-time updates
"""

import requests
import json
import time
import os
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://replyflow-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class CommentsBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.test_users = {}
        self.test_results = []
        self.test_posts = []
        self.test_comments = []
        
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
        """Create test users for Comments testing"""
        users = [
            {"username": "alice_comments", "email": "alice@comments.com", "password": "password123"},
            {"username": "bob_comments", "email": "bob@comments.com", "password": "password123"},
            {"username": "charlie_comments", "email": "charlie@comments.com", "password": "password123"}
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
                                "username": user_data["username"],
                                "avatar": user_info.get("avatar")
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
                                "username": user_data["username"],
                                "avatar": user_info.get("avatar")
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
    
    def create_test_posts(self):
        """Create test posts for commenting"""
        try:
            alice_headers = self.get_auth_headers("alice_comments")
            bob_headers = self.get_auth_headers("bob_comments")
            
            posts_data = [
                {
                    "text": "Alice's first post for comments testing! 📝 #comments #socialvibe",
                    "visibility": "public"
                },
                {
                    "text": "Bob's post about coding and development 💻 #coding #development",
                    "visibility": "public"
                }
            ]
            
            # Alice creates first post
            response = requests.post(f"{self.base_url}/posts", json=posts_data[0], headers=alice_headers)
            if response.status_code == 201:
                post = response.json()
                self.test_posts.append({
                    "id": post["id"],
                    "author": "alice_comments",
                    "author_id": self.test_users["alice_comments"]["user_id"]
                })
                self.log_test("Create Alice's test post", "PASS", f"Post ID: {post['id']}")
            else:
                self.log_test("Create Alice's test post", "FAIL", f"Status: {response.status_code}")
            
            # Bob creates second post
            response = requests.post(f"{self.base_url}/posts", json=posts_data[1], headers=bob_headers)
            if response.status_code == 201:
                post = response.json()
                self.test_posts.append({
                    "id": post["id"],
                    "author": "bob_comments",
                    "author_id": self.test_users["bob_comments"]["user_id"]
                })
                self.log_test("Create Bob's test post", "PASS", f"Post ID: {post['id']}")
            else:
                self.log_test("Create Bob's test post", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Create test posts", "FAIL", str(e))
    
    # ==================== COMMENT CREATION TESTS ====================
    
    def test_create_top_level_comment_success(self):
        """Test POST /api/comments - Create top-level comment successfully"""
        try:
            if not self.test_posts:
                self.log_test("Create top-level comment - Success", "FAIL", "No test posts available")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            alice_post_id = self.test_posts[0]["id"]
            
            comment_data = {
                "post_id": alice_post_id,
                "text": "Great post Alice! This is my first comment 👍 #awesome"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if response.status_code == 201:
                comment = response.json()
                required_fields = ["id", "post_id", "user_id", "username", "text", "parent_comment_id", "likes", "like_count", "reply_count", "is_edited", "created_at"]
                
                if all(field in comment for field in required_fields):
                    if (comment["post_id"] == alice_post_id and 
                        comment["text"] == comment_data["text"] and
                        comment["parent_comment_id"] is None and
                        comment["like_count"] == 0 and
                        comment["reply_count"] == 0 and
                        comment["is_edited"] == False):
                        
                        self.test_comments.append({
                            "id": comment["id"],
                            "post_id": alice_post_id,
                            "author": "bob_comments",
                            "type": "top_level"
                        })
                        self.log_test("Create top-level comment - Success", "PASS", f"Comment created: {comment['id']}")
                    else:
                        self.log_test("Create top-level comment - Success", "FAIL", f"Comment fields incorrect: {comment}")
                else:
                    missing_fields = [f for f in required_fields if f not in comment]
                    self.log_test("Create top-level comment - Success", "FAIL", f"Missing fields: {missing_fields}")
            else:
                self.log_test("Create top-level comment - Success", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create top-level comment - Success", "FAIL", str(e))
    
    def test_create_reply_success(self):
        """Test POST /api/comments - Create reply to comment successfully"""
        try:
            if not self.test_comments:
                self.log_test("Create reply - Success", "FAIL", "No test comments available")
                return
                
            charlie_headers = self.get_auth_headers("charlie_comments")
            parent_comment = self.test_comments[0]
            
            reply_data = {
                "post_id": parent_comment["post_id"],
                "text": "I totally agree with Bob! Great observation 💯",
                "parent_comment_id": parent_comment["id"]
            }
            
            response = requests.post(f"{self.base_url}/comments", json=reply_data, headers=charlie_headers)
            
            if response.status_code == 201:
                reply = response.json()
                
                if (reply["post_id"] == parent_comment["post_id"] and 
                    reply["text"] == reply_data["text"] and
                    reply["parent_comment_id"] == parent_comment["id"] and
                    reply["like_count"] == 0 and
                    reply["reply_count"] == 0):
                    
                    self.test_comments.append({
                        "id": reply["id"],
                        "post_id": parent_comment["post_id"],
                        "parent_id": parent_comment["id"],
                        "author": "charlie_comments",
                        "type": "reply"
                    })
                    self.log_test("Create reply - Success", "PASS", f"Reply created: {reply['id']}")
                else:
                    self.log_test("Create reply - Success", "FAIL", f"Reply fields incorrect: {reply}")
            else:
                self.log_test("Create reply - Success", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create reply - Success", "FAIL", str(e))
    
    def test_create_comment_missing_post_id(self):
        """Test POST /api/comments - Missing post_id validation"""
        try:
            bob_headers = self.get_auth_headers("bob_comments")
            
            comment_data = {
                "text": "This comment is missing post_id"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if response.status_code == 400:
                self.log_test("Create comment - Missing post_id", "PASS", "Correctly rejected missing post_id")
            else:
                self.log_test("Create comment - Missing post_id", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create comment - Missing post_id", "FAIL", str(e))
    
    def test_create_comment_missing_text(self):
        """Test POST /api/comments - Missing text validation"""
        try:
            if not self.test_posts:
                self.log_test("Create comment - Missing text", "FAIL", "No test posts available")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            alice_post_id = self.test_posts[0]["id"]
            
            comment_data = {
                "post_id": alice_post_id
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if response.status_code == 400:
                self.log_test("Create comment - Missing text", "PASS", "Correctly rejected missing text")
            else:
                self.log_test("Create comment - Missing text", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create comment - Missing text", "FAIL", str(e))
    
    def test_create_comment_text_too_long(self):
        """Test POST /api/comments - Text exceeds 500 characters"""
        try:
            if not self.test_posts:
                self.log_test("Create comment - Text too long", "FAIL", "No test posts available")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            alice_post_id = self.test_posts[0]["id"]
            
            long_text = "A" * 501  # 501 characters
            comment_data = {
                "post_id": alice_post_id,
                "text": long_text
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if response.status_code == 400:
                self.log_test("Create comment - Text too long", "PASS", "Correctly rejected text > 500 chars")
            else:
                self.log_test("Create comment - Text too long", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create comment - Text too long", "FAIL", str(e))
    
    def test_create_comment_nonexistent_post(self):
        """Test POST /api/comments - Non-existent post_id"""
        try:
            bob_headers = self.get_auth_headers("bob_comments")
            
            comment_data = {
                "post_id": "nonexistent-post-id",
                "text": "Comment on non-existent post"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if response.status_code == 404:
                self.log_test("Create comment - Non-existent post", "PASS", "Correctly rejected non-existent post")
            else:
                self.log_test("Create comment - Non-existent post", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create comment - Non-existent post", "FAIL", str(e))
    
    def test_create_reply_nonexistent_parent(self):
        """Test POST /api/comments - Non-existent parent_comment_id"""
        try:
            if not self.test_posts:
                self.log_test("Create reply - Non-existent parent", "FAIL", "No test posts available")
                return
                
            charlie_headers = self.get_auth_headers("charlie_comments")
            alice_post_id = self.test_posts[0]["id"]
            
            reply_data = {
                "post_id": alice_post_id,
                "text": "Reply to non-existent comment",
                "parent_comment_id": "nonexistent-comment-id"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=reply_data, headers=charlie_headers)
            
            if response.status_code == 404:
                self.log_test("Create reply - Non-existent parent", "PASS", "Correctly rejected non-existent parent comment")
            else:
                self.log_test("Create reply - Non-existent parent", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Create reply - Non-existent parent", "FAIL", str(e))
    
    # ==================== COMMENT RETRIEVAL TESTS ====================
    
    def test_get_top_level_comments(self):
        """Test GET /api/comments/:postId - Get top-level comments with pagination"""
        try:
            if not self.test_posts:
                self.log_test("Get top-level comments", "FAIL", "No test posts available")
                return
                
            alice_headers = self.get_auth_headers("alice_comments")
            alice_post_id = self.test_posts[0]["id"]
            
            response = requests.get(f"{self.base_url}/comments/{alice_post_id}", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["comments", "total", "limit", "offset"]
                
                if all(field in data for field in required_fields):
                    comments = data["comments"]
                    
                    # Check if we have comments and they're top-level (parent_comment_id is null)
                    if isinstance(comments, list):
                        top_level_comments = [c for c in comments if c.get("parent_comment_id") is None]
                        
                        if len(top_level_comments) > 0:
                            # Check if comments have has_liked field
                            first_comment = top_level_comments[0]
                            if "has_liked" in first_comment:
                                self.log_test("Get top-level comments", "PASS", f"Retrieved {len(top_level_comments)} top-level comments with has_liked field")
                            else:
                                self.log_test("Get top-level comments", "FAIL", "Comments missing has_liked field")
                        else:
                            self.log_test("Get top-level comments", "PASS", "No top-level comments found (expected for new post)")
                    else:
                        self.log_test("Get top-level comments", "FAIL", "Comments field is not a list")
                else:
                    missing_fields = [f for f in required_fields if f not in data]
                    self.log_test("Get top-level comments", "FAIL", f"Missing fields: {missing_fields}")
            else:
                self.log_test("Get top-level comments", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get top-level comments", "FAIL", str(e))
    
    def test_get_comment_replies(self):
        """Test GET /api/comments/:commentId/replies - Get replies for a comment"""
        try:
            if not self.test_comments:
                self.log_test("Get comment replies", "FAIL", "No test comments available")
                return
                
            # Find a top-level comment
            top_level_comment = None
            for comment in self.test_comments:
                if comment.get("type") == "top_level":
                    top_level_comment = comment
                    break
            
            if not top_level_comment:
                self.log_test("Get comment replies", "FAIL", "No top-level comment found")
                return
                
            alice_headers = self.get_auth_headers("alice_comments")
            comment_id = top_level_comment["id"]
            
            response = requests.get(f"{self.base_url}/comments/{comment_id}/replies", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                
                if "replies" in data:
                    replies = data["replies"]
                    
                    if isinstance(replies, list):
                        # Check if replies have has_liked field and are sorted by created_at ASC
                        if len(replies) > 0:
                            first_reply = replies[0]
                            if "has_liked" in first_reply and "created_at" in first_reply:
                                self.log_test("Get comment replies", "PASS", f"Retrieved {len(replies)} replies with has_liked field")
                            else:
                                self.log_test("Get comment replies", "FAIL", "Replies missing required fields")
                        else:
                            self.log_test("Get comment replies", "PASS", "No replies found (expected for new comment)")
                    else:
                        self.log_test("Get comment replies", "FAIL", "Replies field is not a list")
                else:
                    self.log_test("Get comment replies", "FAIL", "Missing replies field")
            else:
                self.log_test("Get comment replies", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get comment replies", "FAIL", str(e))
    
    def test_get_replies_nonexistent_comment(self):
        """Test GET /api/comments/:commentId/replies - Non-existent comment ID"""
        try:
            alice_headers = self.get_auth_headers("alice_comments")
            
            response = requests.get(f"{self.base_url}/comments/nonexistent-comment-id/replies", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                if "replies" in data and len(data["replies"]) == 0:
                    self.log_test("Get replies - Non-existent comment", "PASS", "Returns empty replies for non-existent comment")
                else:
                    self.log_test("Get replies - Non-existent comment", "FAIL", f"Unexpected response: {data}")
            else:
                self.log_test("Get replies - Non-existent comment", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get replies - Non-existent comment", "FAIL", str(e))
    
    # ==================== COMMENT EDITING TESTS ====================
    
    def test_edit_own_comment_success(self):
        """Test PUT /api/comments/:commentId - Edit own comment successfully"""
        try:
            if not self.test_comments:
                self.log_test("Edit own comment - Success", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Edit own comment - Success", "FAIL", "No Bob's comment found")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            comment_id = bob_comment["id"]
            
            edit_data = {
                "text": "Updated comment text! This has been edited 📝 #edited"
            }
            
            response = requests.put(f"{self.base_url}/comments/{comment_id}", json=edit_data, headers=bob_headers)
            
            if response.status_code == 200:
                updated_comment = response.json()
                
                if (updated_comment["text"] == edit_data["text"] and
                    updated_comment["is_edited"] == True and
                    "updated_at" in updated_comment and
                    "has_liked" in updated_comment):
                    self.log_test("Edit own comment - Success", "PASS", f"Comment edited successfully: {comment_id}")
                else:
                    self.log_test("Edit own comment - Success", "FAIL", f"Edit fields incorrect: {updated_comment}")
            else:
                self.log_test("Edit own comment - Success", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Edit own comment - Success", "FAIL", str(e))
    
    def test_edit_comment_missing_text(self):
        """Test PUT /api/comments/:commentId - Missing text validation"""
        try:
            if not self.test_comments:
                self.log_test("Edit comment - Missing text", "FAIL", "No test comments available")
                return
                
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Edit comment - Missing text", "FAIL", "No Bob's comment found")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            comment_id = bob_comment["id"]
            
            response = requests.put(f"{self.base_url}/comments/{comment_id}", json={}, headers=bob_headers)
            
            if response.status_code == 400:
                self.log_test("Edit comment - Missing text", "PASS", "Correctly rejected missing text")
            else:
                self.log_test("Edit comment - Missing text", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Edit comment - Missing text", "FAIL", str(e))
    
    def test_edit_comment_text_too_long(self):
        """Test PUT /api/comments/:commentId - Text exceeds 500 characters"""
        try:
            if not self.test_comments:
                self.log_test("Edit comment - Text too long", "FAIL", "No test comments available")
                return
                
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Edit comment - Text too long", "FAIL", "No Bob's comment found")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            comment_id = bob_comment["id"]
            
            long_text = "B" * 501  # 501 characters
            edit_data = {"text": long_text}
            
            response = requests.put(f"{self.base_url}/comments/{comment_id}", json=edit_data, headers=bob_headers)
            
            if response.status_code == 400:
                self.log_test("Edit comment - Text too long", "PASS", "Correctly rejected text > 500 chars")
            else:
                self.log_test("Edit comment - Text too long", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Edit comment - Text too long", "FAIL", str(e))
    
    def test_edit_other_user_comment(self):
        """Test PUT /api/comments/:commentId - Cannot edit other user's comment"""
        try:
            if not self.test_comments:
                self.log_test("Edit other user comment", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Edit other user comment", "FAIL", "No Bob's comment found")
                return
                
            # Try to edit Bob's comment as Alice
            alice_headers = self.get_auth_headers("alice_comments")
            comment_id = bob_comment["id"]
            
            edit_data = {
                "text": "Alice trying to edit Bob's comment - should fail!"
            }
            
            response = requests.put(f"{self.base_url}/comments/{comment_id}", json=edit_data, headers=alice_headers)
            
            if response.status_code == 403:
                self.log_test("Edit other user comment", "PASS", "Correctly rejected editing other user's comment")
            else:
                self.log_test("Edit other user comment", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Edit other user comment", "FAIL", str(e))
    
    def test_edit_nonexistent_comment(self):
        """Test PUT /api/comments/:commentId - Non-existent comment ID"""
        try:
            alice_headers = self.get_auth_headers("alice_comments")
            
            edit_data = {
                "text": "Trying to edit non-existent comment"
            }
            
            response = requests.put(f"{self.base_url}/comments/nonexistent-comment-id", json=edit_data, headers=alice_headers)
            
            if response.status_code == 404:
                self.log_test("Edit non-existent comment", "PASS", "Correctly rejected non-existent comment")
            else:
                self.log_test("Edit non-existent comment", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Edit non-existent comment", "FAIL", str(e))
    
    # ==================== COMMENT DELETION TESTS ====================
    
    def test_delete_comment_no_replies(self):
        """Test DELETE /api/comments/:commentId - Delete comment with no replies (hard delete)"""
        try:
            # Create a new comment specifically for deletion testing
            alice_headers = self.get_auth_headers("alice_comments")
            
            if not self.test_posts:
                self.log_test("Delete comment - No replies", "FAIL", "No test posts available")
                return
                
            alice_post_id = self.test_posts[0]["id"]
            
            # Create comment to delete
            comment_data = {
                "post_id": alice_post_id,
                "text": "This comment will be deleted (no replies)"
            }
            
            create_response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=alice_headers)
            
            if create_response.status_code == 201:
                comment = create_response.json()
                comment_id = comment["id"]
                
                # Delete the comment
                delete_response = requests.delete(f"{self.base_url}/comments/{comment_id}", headers=alice_headers)
                
                if delete_response.status_code == 200:
                    # Verify comment is actually deleted by trying to get it
                    get_response = requests.get(f"{self.base_url}/comments/{alice_post_id}", headers=alice_headers)
                    
                    if get_response.status_code == 200:
                        comments_data = get_response.json()
                        deleted_comment_found = any(c.get("id") == comment_id for c in comments_data.get("comments", []))
                        
                        if not deleted_comment_found:
                            self.log_test("Delete comment - No replies", "PASS", "Comment hard deleted successfully")
                        else:
                            self.log_test("Delete comment - No replies", "FAIL", "Comment still exists after deletion")
                    else:
                        self.log_test("Delete comment - No replies", "FAIL", f"Failed to verify deletion: {get_response.status_code}")
                else:
                    self.log_test("Delete comment - No replies", "FAIL", f"Delete status: {delete_response.status_code}")
            else:
                self.log_test("Delete comment - No replies", "FAIL", f"Failed to create comment: {create_response.status_code}")
        except Exception as e:
            self.log_test("Delete comment - No replies", "FAIL", str(e))
    
    def test_delete_comment_with_replies(self):
        """Test DELETE /api/comments/:commentId - Delete comment with replies (soft delete)"""
        try:
            if not self.test_comments:
                self.log_test("Delete comment - With replies", "FAIL", "No test comments available")
                return
                
            # Find a comment that has replies
            parent_comment = None
            for comment in self.test_comments:
                if comment.get("type") == "top_level":
                    parent_comment = comment
                    break
            
            if not parent_comment:
                self.log_test("Delete comment - With replies", "FAIL", "No top-level comment found")
                return
                
            # Get the comment author's headers
            author_username = parent_comment["author"]
            author_headers = self.get_auth_headers(author_username)
            comment_id = parent_comment["id"]
            
            # Delete the comment
            delete_response = requests.delete(f"{self.base_url}/comments/{comment_id}", headers=author_headers)
            
            if delete_response.status_code == 200:
                # Verify comment is soft deleted by checking if text is [deleted]
                get_response = requests.get(f"{self.base_url}/comments/{parent_comment['post_id']}", headers=author_headers)
                
                if get_response.status_code == 200:
                    comments_data = get_response.json()
                    deleted_comment = None
                    
                    for c in comments_data.get("comments", []):
                        if c.get("id") == comment_id:
                            deleted_comment = c
                            break
                    
                    if deleted_comment:
                        if (deleted_comment.get("text") == "[deleted]" and 
                            deleted_comment.get("username") == "[deleted]"):
                            self.log_test("Delete comment - With replies", "PASS", "Comment soft deleted successfully")
                        else:
                            self.log_test("Delete comment - With replies", "FAIL", f"Comment not properly soft deleted: {deleted_comment}")
                    else:
                        self.log_test("Delete comment - With replies", "FAIL", "Comment not found after deletion")
                else:
                    self.log_test("Delete comment - With replies", "FAIL", f"Failed to verify deletion: {get_response.status_code}")
            else:
                self.log_test("Delete comment - With replies", "FAIL", f"Delete status: {delete_response.status_code}")
        except Exception as e:
            self.log_test("Delete comment - With replies", "FAIL", str(e))
    
    def test_delete_other_user_comment(self):
        """Test DELETE /api/comments/:commentId - Cannot delete other user's comment"""
        try:
            if not self.test_comments:
                self.log_test("Delete other user comment", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Delete other user comment", "FAIL", "No Bob's comment found")
                return
                
            # Try to delete Bob's comment as Alice
            alice_headers = self.get_auth_headers("alice_comments")
            comment_id = bob_comment["id"]
            
            response = requests.delete(f"{self.base_url}/comments/{comment_id}", headers=alice_headers)
            
            if response.status_code == 403:
                self.log_test("Delete other user comment", "PASS", "Correctly rejected deleting other user's comment")
            else:
                self.log_test("Delete other user comment", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Delete other user comment", "FAIL", str(e))
    
    def test_delete_nonexistent_comment(self):
        """Test DELETE /api/comments/:commentId - Non-existent comment ID"""
        try:
            alice_headers = self.get_auth_headers("alice_comments")
            
            response = requests.delete(f"{self.base_url}/comments/nonexistent-comment-id", headers=alice_headers)
            
            if response.status_code == 404:
                self.log_test("Delete non-existent comment", "PASS", "Correctly rejected non-existent comment")
            else:
                self.log_test("Delete non-existent comment", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Delete non-existent comment", "FAIL", str(e))
    
    # ==================== COMMENT LIKES TESTS ====================
    
    def test_like_comment_success(self):
        """Test POST /api/comments/:commentId/like - Like comment successfully"""
        try:
            if not self.test_comments:
                self.log_test("Like comment - Success", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment to like as Alice
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Like comment - Success", "FAIL", "No Bob's comment found")
                return
                
            alice_headers = self.get_auth_headers("alice_comments")
            comment_id = bob_comment["id"]
            
            response = requests.post(f"{self.base_url}/comments/{comment_id}/like", headers=alice_headers)
            
            if response.status_code == 200:
                liked_comment = response.json()
                
                if (liked_comment.get("has_liked") == True and
                    liked_comment.get("like_count") > 0 and
                    "likes" in liked_comment):
                    self.log_test("Like comment - Success", "PASS", f"Comment liked successfully, count: {liked_comment['like_count']}")
                else:
                    self.log_test("Like comment - Success", "FAIL", f"Like fields incorrect: {liked_comment}")
            else:
                self.log_test("Like comment - Success", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Like comment - Success", "FAIL", str(e))
    
    def test_unlike_comment_toggle(self):
        """Test POST /api/comments/:commentId/like - Unlike comment (toggle behavior)"""
        try:
            if not self.test_comments:
                self.log_test("Unlike comment - Toggle", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment (should be liked from previous test)
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Unlike comment - Toggle", "FAIL", "No Bob's comment found")
                return
                
            alice_headers = self.get_auth_headers("alice_comments")
            comment_id = bob_comment["id"]
            
            # Like again to toggle (unlike)
            response = requests.post(f"{self.base_url}/comments/{comment_id}/like", headers=alice_headers)
            
            if response.status_code == 200:
                unliked_comment = response.json()
                
                if (unliked_comment.get("has_liked") == False and
                    unliked_comment.get("like_count") == 0):
                    self.log_test("Unlike comment - Toggle", "PASS", f"Comment unliked successfully, count: {unliked_comment['like_count']}")
                else:
                    self.log_test("Unlike comment - Toggle", "FAIL", f"Unlike fields incorrect: {unliked_comment}")
            else:
                self.log_test("Unlike comment - Toggle", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Unlike comment - Toggle", "FAIL", str(e))
    
    def test_unlike_comment_delete_endpoint(self):
        """Test DELETE /api/comments/:commentId/like - Unlike comment using DELETE endpoint"""
        try:
            if not self.test_comments:
                self.log_test("Unlike comment - DELETE endpoint", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment and like it first
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Unlike comment - DELETE endpoint", "FAIL", "No Bob's comment found")
                return
                
            alice_headers = self.get_auth_headers("alice_comments")
            comment_id = bob_comment["id"]
            
            # Like first
            requests.post(f"{self.base_url}/comments/{comment_id}/like", headers=alice_headers)
            
            # Then unlike using DELETE
            response = requests.delete(f"{self.base_url}/comments/{comment_id}/like", headers=alice_headers)
            
            if response.status_code == 200:
                unliked_comment = response.json()
                
                if (unliked_comment.get("has_liked") == False and
                    unliked_comment.get("like_count") == 0):
                    self.log_test("Unlike comment - DELETE endpoint", "PASS", "Comment unliked using DELETE endpoint")
                else:
                    self.log_test("Unlike comment - DELETE endpoint", "FAIL", f"Unlike fields incorrect: {unliked_comment}")
            else:
                self.log_test("Unlike comment - DELETE endpoint", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Unlike comment - DELETE endpoint", "FAIL", str(e))
    
    def test_like_nonexistent_comment(self):
        """Test POST /api/comments/:commentId/like - Non-existent comment ID"""
        try:
            alice_headers = self.get_auth_headers("alice_comments")
            
            response = requests.post(f"{self.base_url}/comments/nonexistent-comment-id/like", headers=alice_headers)
            
            if response.status_code == 404:
                self.log_test("Like non-existent comment", "PASS", "Correctly rejected non-existent comment")
            else:
                self.log_test("Like non-existent comment", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Like non-existent comment", "FAIL", str(e))
    
    # ==================== NOTIFICATION TESTS ====================
    
    def test_comment_notification_creation(self):
        """Test that comment notifications are created for post authors"""
        try:
            if not self.test_posts:
                self.log_test("Comment notification creation", "FAIL", "No test posts available")
                return
                
            alice_headers = self.get_auth_headers("alice_comments")
            bob_headers = self.get_auth_headers("bob_comments")
            alice_post_id = self.test_posts[0]["id"]
            
            # Get Alice's notifications before comment
            before_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Bob comments on Alice's post
            comment_data = {
                "post_id": alice_post_id,
                "text": "Notification test comment from Bob! 🔔"
            }
            
            comment_response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if comment_response.status_code == 201:
                # Wait for notification to be created
                time.sleep(1)
                
                # Get Alice's notifications after comment
                after_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    
                    # Look for comment notification
                    comment_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'comment' and 
                            notif.get('actor_username') == 'bob_comments' and
                            notif.get('post_id') == alice_post_id):
                            comment_notification = notif
                            break
                    
                    if comment_notification:
                        required_fields = ['actor_id', 'actor_username', 'type', 'post_id', 'comment_id', 'text']
                        if all(field in comment_notification for field in required_fields):
                            self.log_test("Comment notification creation", "PASS", 
                                        f"Comment notification created: {comment_notification['text']}")
                        else:
                            self.log_test("Comment notification creation", "FAIL", 
                                        f"Missing required fields in notification: {comment_notification}")
                    else:
                        self.log_test("Comment notification creation", "FAIL", 
                                    f"No comment notification found. Before: {before_count}, After: {len(notifications)}")
                else:
                    self.log_test("Comment notification creation", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Comment notification creation", "FAIL", 
                            f"Failed to create comment: {comment_response.status_code}")
        except Exception as e:
            self.log_test("Comment notification creation", "FAIL", str(e))
    
    def test_reply_notification_creation(self):
        """Test that reply notifications are created for parent comment authors"""
        try:
            if not self.test_comments:
                self.log_test("Reply notification creation", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Reply notification creation", "FAIL", "No Bob's comment found")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            charlie_headers = self.get_auth_headers("charlie_comments")
            
            # Get Bob's notifications before reply
            before_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Charlie replies to Bob's comment
            reply_data = {
                "post_id": bob_comment["post_id"],
                "text": "Notification test reply from Charlie! 💬",
                "parent_comment_id": bob_comment["id"]
            }
            
            reply_response = requests.post(f"{self.base_url}/comments", json=reply_data, headers=charlie_headers)
            
            if reply_response.status_code == 201:
                # Wait for notification to be created
                time.sleep(1)
                
                # Get Bob's notifications after reply
                after_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    
                    # Look for comment_reply notification
                    reply_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'comment_reply' and 
                            notif.get('actor_username') == 'charlie_comments'):
                            reply_notification = notif
                            break
                    
                    if reply_notification:
                        required_fields = ['actor_id', 'actor_username', 'type', 'post_id', 'comment_id', 'text']
                        if all(field in reply_notification for field in required_fields):
                            self.log_test("Reply notification creation", "PASS", 
                                        f"Reply notification created: {reply_notification['text']}")
                        else:
                            self.log_test("Reply notification creation", "FAIL", 
                                        f"Missing required fields in notification: {reply_notification}")
                    else:
                        self.log_test("Reply notification creation", "FAIL", 
                                    f"No reply notification found. Before: {before_count}, After: {len(notifications)}")
                else:
                    self.log_test("Reply notification creation", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Reply notification creation", "FAIL", 
                            f"Failed to create reply: {reply_response.status_code}")
        except Exception as e:
            self.log_test("Reply notification creation", "FAIL", str(e))
    
    def test_like_notification_creation(self):
        """Test that like notifications are created for comment authors"""
        try:
            if not self.test_comments:
                self.log_test("Like notification creation", "FAIL", "No test comments available")
                return
                
            # Find Bob's comment
            bob_comment = None
            for comment in self.test_comments:
                if comment.get("author") == "bob_comments":
                    bob_comment = comment
                    break
            
            if not bob_comment:
                self.log_test("Like notification creation", "FAIL", "No Bob's comment found")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            alice_headers = self.get_auth_headers("alice_comments")
            
            # Get Bob's notifications before like
            before_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Alice likes Bob's comment
            like_response = requests.post(f"{self.base_url}/comments/{bob_comment['id']}/like", headers=alice_headers)
            
            if like_response.status_code == 200:
                # Wait for notification to be created
                time.sleep(1)
                
                # Get Bob's notifications after like
                after_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    
                    # Look for comment_like notification
                    like_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'comment_like' and 
                            notif.get('actor_username') == 'alice_comments'):
                            like_notification = notif
                            break
                    
                    if like_notification:
                        required_fields = ['actor_id', 'actor_username', 'type', 'post_id', 'comment_id', 'text']
                        if all(field in like_notification for field in required_fields):
                            self.log_test("Like notification creation", "PASS", 
                                        f"Like notification created: {like_notification['text']}")
                        else:
                            self.log_test("Like notification creation", "FAIL", 
                                        f"Missing required fields in notification: {like_notification}")
                    else:
                        self.log_test("Like notification creation", "FAIL", 
                                    f"No like notification found. Before: {before_count}, After: {len(notifications)}")
                else:
                    self.log_test("Like notification creation", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Like notification creation", "FAIL", 
                            f"Failed to like comment: {like_response.status_code}")
        except Exception as e:
            self.log_test("Like notification creation", "FAIL", str(e))
    
    def test_no_self_comment_notification(self):
        """Test that no notification is created for self-comments"""
        try:
            if not self.test_posts:
                self.log_test("No self-comment notification", "FAIL", "No test posts available")
                return
                
            alice_headers = self.get_auth_headers("alice_comments")
            alice_post_id = self.test_posts[0]["id"]  # Alice's own post
            
            # Get Alice's notifications before self-comment
            before_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
            before_notifications = before_response.json() if before_response.status_code == 200 else []
            
            # Alice comments on her own post
            comment_data = {
                "post_id": alice_post_id,
                "text": "Alice commenting on her own post - no notification should be created"
            }
            
            comment_response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=alice_headers)
            
            if comment_response.status_code == 201:
                # Wait a moment
                time.sleep(1)
                
                # Get Alice's notifications after self-comment
                after_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
                
                if after_response.status_code == 200:
                    after_notifications = after_response.json()
                    
                    # Check if any new comment notifications were created
                    new_comment_notifications = []
                    for notif in after_notifications:
                        if (notif.get('type') == 'comment' and 
                            notif.get('actor_username') == 'alice_comments' and
                            notif.get('post_id') == alice_post_id):
                            # Check if this notification is new
                            is_new = True
                            for old_notif in before_notifications:
                                if old_notif.get('id') == notif.get('id'):
                                    is_new = False
                                    break
                            if is_new:
                                new_comment_notifications.append(notif)
                    
                    if len(new_comment_notifications) == 0:
                        self.log_test("No self-comment notification", "PASS", "No notification created for self-comment")
                    else:
                        self.log_test("No self-comment notification", "FAIL", 
                                    f"Self-comment notification created: {new_comment_notifications}")
                else:
                    self.log_test("No self-comment notification", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("No self-comment notification", "FAIL", 
                            f"Failed to create self-comment: {comment_response.status_code}")
        except Exception as e:
            self.log_test("No self-comment notification", "FAIL", str(e))
    
    def test_no_self_like_notification(self):
        """Test that no notification is created for self-likes"""
        try:
            # Create a comment by Bob first
            if not self.test_posts:
                self.log_test("No self-like notification", "FAIL", "No test posts available")
                return
                
            bob_headers = self.get_auth_headers("bob_comments")
            alice_post_id = self.test_posts[0]["id"]
            
            # Bob creates a comment
            comment_data = {
                "post_id": alice_post_id,
                "text": "Bob's comment for self-like test"
            }
            
            comment_response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if comment_response.status_code == 201:
                comment = comment_response.json()
                comment_id = comment["id"]
                
                # Get Bob's notifications before self-like
                before_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
                before_notifications = before_response.json() if before_response.status_code == 200 else []
                
                # Bob likes his own comment
                like_response = requests.post(f"{self.base_url}/comments/{comment_id}/like", headers=bob_headers)
                
                if like_response.status_code == 200:
                    # Wait a moment
                    time.sleep(1)
                    
                    # Get Bob's notifications after self-like
                    after_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
                    
                    if after_response.status_code == 200:
                        after_notifications = after_response.json()
                        
                        # Check if any new like notifications were created
                        new_like_notifications = []
                        for notif in after_notifications:
                            if (notif.get('type') == 'comment_like' and 
                                notif.get('actor_username') == 'bob_comments' and
                                notif.get('comment_id') == comment_id):
                                # Check if this notification is new
                                is_new = True
                                for old_notif in before_notifications:
                                    if old_notif.get('id') == notif.get('id'):
                                        is_new = False
                                        break
                                if is_new:
                                    new_like_notifications.append(notif)
                        
                        if len(new_like_notifications) == 0:
                            self.log_test("No self-like notification", "PASS", "No notification created for self-like")
                        else:
                            self.log_test("No self-like notification", "FAIL", 
                                        f"Self-like notification created: {new_like_notifications}")
                    else:
                        self.log_test("No self-like notification", "FAIL", 
                                    f"Failed to get notifications: {after_response.status_code}")
                else:
                    self.log_test("No self-like notification", "FAIL", 
                                f"Failed to like comment: {like_response.status_code}")
            else:
                self.log_test("No self-like notification", "FAIL", 
                            f"Failed to create comment: {comment_response.status_code}")
        except Exception as e:
            self.log_test("No self-like notification", "FAIL", str(e))
    
    # ==================== COMPLETE WORKFLOW TEST ====================
    
    def test_complete_comments_workflow(self):
        """Test complete Comments + Replies workflow"""
        try:
            alice_headers = self.get_auth_headers("alice_comments")
            bob_headers = self.get_auth_headers("bob_comments")
            charlie_headers = self.get_auth_headers("charlie_comments")
            
            if not self.test_posts:
                self.log_test("Complete comments workflow", "FAIL", "No test posts available")
                return
                
            alice_post_id = self.test_posts[0]["id"]
            
            # Step 1: Bob comments on Alice's post
            comment_data = {
                "post_id": alice_post_id,
                "text": "Workflow test: Bob's original comment! 🚀"
            }
            
            comment_response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=bob_headers)
            
            if comment_response.status_code != 201:
                self.log_test("Complete workflow - Comment creation", "FAIL", f"Comment creation failed: {comment_response.status_code}")
                return
            
            comment = comment_response.json()
            comment_id = comment["id"]
            
            # Step 2: Charlie replies to Bob's comment
            reply_data = {
                "post_id": alice_post_id,
                "text": "Workflow test: Charlie's reply to Bob! 💬",
                "parent_comment_id": comment_id
            }
            
            reply_response = requests.post(f"{self.base_url}/comments", json=reply_data, headers=charlie_headers)
            
            if reply_response.status_code != 201:
                self.log_test("Complete workflow - Reply creation", "FAIL", f"Reply creation failed: {reply_response.status_code}")
                return
            
            reply = reply_response.json()
            reply_id = reply["id"]
            
            # Step 3: Alice likes Bob's comment
            like_response = requests.post(f"{self.base_url}/comments/{comment_id}/like", headers=alice_headers)
            
            if like_response.status_code != 200:
                self.log_test("Complete workflow - Like comment", "FAIL", f"Like failed: {like_response.status_code}")
                return
            
            # Step 4: Bob edits his comment
            edit_data = {
                "text": "Workflow test: Bob's EDITED comment! 📝 (was edited)"
            }
            
            edit_response = requests.put(f"{self.base_url}/comments/{comment_id}", json=edit_data, headers=bob_headers)
            
            if edit_response.status_code != 200:
                self.log_test("Complete workflow - Edit comment", "FAIL", f"Edit failed: {edit_response.status_code}")
                return
            
            # Step 5: Verify all counts and states
            # Get comments for the post
            get_comments_response = requests.get(f"{self.base_url}/comments/{alice_post_id}", headers=alice_headers)
            
            if get_comments_response.status_code == 200:
                comments_data = get_comments_response.json()
                comments = comments_data.get("comments", [])
                
                # Find Bob's comment
                bob_comment = None
                for c in comments:
                    if c.get("id") == comment_id:
                        bob_comment = c
                        break
                
                if bob_comment:
                    # Verify comment was edited and liked
                    if (bob_comment.get("is_edited") == True and
                        bob_comment.get("like_count") > 0 and
                        bob_comment.get("reply_count") > 0 and
                        bob_comment.get("text") == edit_data["text"]):
                        
                        # Get replies for Bob's comment
                        replies_response = requests.get(f"{self.base_url}/comments/{comment_id}/replies", headers=alice_headers)
                        
                        if replies_response.status_code == 200:
                            replies_data = replies_response.json()
                            replies = replies_data.get("replies", [])
                            
                            # Find Charlie's reply
                            charlie_reply = None
                            for r in replies:
                                if r.get("id") == reply_id:
                                    charlie_reply = r
                                    break
                            
                            if charlie_reply and charlie_reply.get("text") == reply_data["text"]:
                                self.log_test("Complete Comments workflow", "PASS", 
                                            "Full workflow successful: Comment → Reply → Like → Edit → Verify")
                            else:
                                self.log_test("Complete Comments workflow", "FAIL", "Reply not found or incorrect")
                        else:
                            self.log_test("Complete Comments workflow", "FAIL", f"Failed to get replies: {replies_response.status_code}")
                    else:
                        self.log_test("Complete Comments workflow", "FAIL", f"Comment state incorrect: {bob_comment}")
                else:
                    self.log_test("Complete Comments workflow", "FAIL", "Bob's comment not found")
            else:
                self.log_test("Complete Comments workflow", "FAIL", f"Failed to get comments: {get_comments_response.status_code}")
                
        except Exception as e:
            self.log_test("Complete Comments workflow", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all Comments + Replies backend tests"""
        print("🚀 Starting SocialVibe Backend Testing Suite - Comments + Replies System")
        print("=" * 80)
        
        # Setup
        print("\n📋 Setting up test environment...")
        self.create_test_users()
        self.create_test_posts()
        
        # Comment Creation Tests
        print("\n💬 Testing Comment Creation...")
        self.test_create_top_level_comment_success()
        self.test_create_reply_success()
        self.test_create_comment_missing_post_id()
        self.test_create_comment_missing_text()
        self.test_create_comment_text_too_long()
        self.test_create_comment_nonexistent_post()
        self.test_create_reply_nonexistent_parent()
        
        # Comment Retrieval Tests
        print("\n📖 Testing Comment Retrieval...")
        self.test_get_top_level_comments()
        self.test_get_comment_replies()
        self.test_get_replies_nonexistent_comment()
        
        # Comment Editing Tests
        print("\n✏️ Testing Comment Editing...")
        self.test_edit_own_comment_success()
        self.test_edit_comment_missing_text()
        self.test_edit_comment_text_too_long()
        self.test_edit_other_user_comment()
        self.test_edit_nonexistent_comment()
        
        # Comment Deletion Tests
        print("\n🗑️ Testing Comment Deletion...")
        self.test_delete_comment_no_replies()
        self.test_delete_comment_with_replies()
        self.test_delete_other_user_comment()
        self.test_delete_nonexistent_comment()
        
        # Comment Likes Tests
        print("\n❤️ Testing Comment Likes...")
        self.test_like_comment_success()
        self.test_unlike_comment_toggle()
        self.test_unlike_comment_delete_endpoint()
        self.test_like_nonexistent_comment()
        
        # Notification Tests
        print("\n🔔 Testing Notifications...")
        self.test_comment_notification_creation()
        self.test_reply_notification_creation()
        self.test_like_notification_creation()
        self.test_no_self_comment_notification()
        self.test_no_self_like_notification()
        
        # Complete Workflow Test
        print("\n🔄 Testing Complete Workflow...")
        self.test_complete_comments_workflow()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMMENTS + REPLIES TESTING SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        total = len(self.test_results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/total)*100:.1f}%")
        
        # Categorize results
        creation_tests = [r for r in self.test_results if 'create' in r['test'].lower() or 'reply' in r['test'].lower()]
        retrieval_tests = [r for r in self.test_results if 'get' in r['test'].lower()]
        editing_tests = [r for r in self.test_results if 'edit' in r['test'].lower()]
        deletion_tests = [r for r in self.test_results if 'delete' in r['test'].lower()]
        likes_tests = [r for r in self.test_results if 'like' in r['test'].lower() and 'notification' not in r['test'].lower()]
        notification_tests = [r for r in self.test_results if 'notification' in r['test'].lower()]
        workflow_tests = [r for r in self.test_results if 'workflow' in r['test'].lower()]
        
        print(f"\n📊 BREAKDOWN:")
        print(f"   💬 Creation: {len([r for r in creation_tests if r['status'] == 'PASS'])}/{len(creation_tests)} passed")
        print(f"   📖 Retrieval: {len([r for r in retrieval_tests if r['status'] == 'PASS'])}/{len(retrieval_tests)} passed")
        print(f"   ✏️ Editing: {len([r for r in editing_tests if r['status'] == 'PASS'])}/{len(editing_tests)} passed")
        print(f"   🗑️ Deletion: {len([r for r in deletion_tests if r['status'] == 'PASS'])}/{len(deletion_tests)} passed")
        print(f"   ❤️ Likes: {len([r for r in likes_tests if r['status'] == 'PASS'])}/{len(likes_tests)} passed")
        print(f"   🔔 Notifications: {len([r for r in notification_tests if r['status'] == 'PASS'])}/{len(notification_tests)} passed")
        print(f"   🔄 Workflow: {len([r for r in workflow_tests if r['status'] == 'PASS'])}/{len(workflow_tests)} passed")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = CommentsBackendTester()
    results = tester.run_all_tests()