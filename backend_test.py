#!/usr/bin/env python3
"""
SocialVibe Backend Testing Suite - Track A Comments Upgrade Pack
Tests Comment Emoji Reactions, Sorting & Filtering, Real-time Updates, and @Mentions
"""

import requests
import json
import time
import os
import io
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://deploy-readiness-14.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class CommentsUpgradePackTester:
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
        """Create test users for Comments Upgrade Pack testing"""
        users = [
            {"username": "alice_comments", "email": "alice@comments.com", "password": "password123"},
            {"username": "bob_comments", "email": "bob@comments.com", "password": "password123"},
            {"username": "charlie_comments", "email": "charlie@comments.com", "password": "password123"},
            {"username": "diana_comments", "email": "diana@comments.com", "password": "password123"}
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
    
    # ==================== SETUP METHODS ====================
    
    def create_test_post(self, author_username="alice_comments"):
        """Create a test post for comment testing"""
        try:
            headers = self.get_auth_headers(author_username)
            post_data = {
                "text": "This is a test post for comment reactions and mentions! 🚀 #testing #comments",
                "visibility": "public"
            }
            
            response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
            
            if response.status_code == 201:
                post = response.json()
                self.test_posts.append(post['id'])
                self.log_test(f"Create test post by {author_username}", "PASS", f"Post created: {post['id']}")
                return post['id']
            else:
                self.log_test(f"Create test post by {author_username}", "FAIL", f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test(f"Create test post by {author_username}", "FAIL", str(e))
            return None
    
    def create_test_comment(self, post_id, author_username="alice_comments", text="Test comment for reactions! 💬"):
        """Create a test comment for reaction testing"""
        try:
            headers = self.get_auth_headers(author_username)
            comment_data = {
                "post_id": post_id,
                "text": text
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=headers)
            
            if response.status_code == 201:
                comment = response.json()
                self.test_comments.append(comment['id'])
                self.log_test(f"Create test comment by {author_username}", "PASS", f"Comment created: {comment['id']}")
                return comment['id']
            else:
                self.log_test(f"Create test comment by {author_username}", "FAIL", f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test(f"Create test comment by {author_username}", "FAIL", str(e))
            return None
    
    # ==================== FEATURE 1: COMMENT EMOJI REACTIONS ====================
    
    def test_comment_reaction_add_all_types(self):
        """Test POST /api/comments/:commentId/react - Add all 6 reaction types"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            comment_id = self.create_test_comment(post_id, "alice_comments", "Test comment for all reactions! 😊")
            if not comment_id:
                return
            
            bob_headers = self.get_auth_headers("bob_comments")
            reaction_types = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
            
            for reaction_type in reaction_types:
                response = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                       json={"reaction_type": reaction_type}, headers=bob_headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if (data.get('user_reaction') == reaction_type and 
                        data.get('reaction_summary', {}).get(reaction_type, 0) >= 1):
                        self.log_test(f"Add {reaction_type} reaction", "PASS", f"Reaction added successfully")
                    else:
                        self.log_test(f"Add {reaction_type} reaction", "FAIL", f"Reaction not properly stored: {data}")
                else:
                    self.log_test(f"Add {reaction_type} reaction", "FAIL", f"Status: {response.status_code}")
                
                # Remove reaction to test next one
                requests.delete(f"{self.base_url}/comments/{comment_id}/react/{reaction_type}", headers=bob_headers)
                
        except Exception as e:
            self.log_test("Add all reaction types", "FAIL", str(e))
    
    def test_comment_reaction_toggle_behavior(self):
        """Test reaction toggle behavior - same reaction removes it"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            comment_id = self.create_test_comment(post_id, "alice_comments", "Test comment for toggle! 🔄")
            if not comment_id:
                return
            
            bob_headers = self.get_auth_headers("bob_comments")
            
            # Add like reaction
            response1 = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                    json={"reaction_type": "like"}, headers=bob_headers)
            
            if response1.status_code == 200:
                data1 = response1.json()
                if data1.get('user_reaction') == 'like':
                    # Add same reaction again (should remove it)
                    response2 = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                            json={"reaction_type": "like"}, headers=bob_headers)
                    
                    if response2.status_code == 200:
                        data2 = response2.json()
                        if data2.get('user_reaction') is None:
                            self.log_test("Reaction toggle behavior", "PASS", "Like reaction toggled off successfully")
                        else:
                            self.log_test("Reaction toggle behavior", "FAIL", f"Reaction not removed: {data2}")
                    else:
                        self.log_test("Reaction toggle behavior", "FAIL", f"Toggle status: {response2.status_code}")
                else:
                    self.log_test("Reaction toggle behavior", "FAIL", "Initial reaction not added")
            else:
                self.log_test("Reaction toggle behavior", "FAIL", f"Initial status: {response1.status_code}")
                
        except Exception as e:
            self.log_test("Reaction toggle behavior", "FAIL", str(e))
    
    def test_comment_reaction_change_type(self):
        """Test changing reaction type (like to love)"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            comment_id = self.create_test_comment(post_id, "alice_comments", "Test comment for reaction change! 🔄")
            if not comment_id:
                return
            
            bob_headers = self.get_auth_headers("bob_comments")
            
            # Add like reaction
            response1 = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                    json={"reaction_type": "like"}, headers=bob_headers)
            
            if response1.status_code == 200:
                # Change to love reaction
                response2 = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                        json={"reaction_type": "love"}, headers=bob_headers)
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    if (data2.get('user_reaction') == 'love' and 
                        data2.get('reaction_summary', {}).get('like', 0) == 0 and
                        data2.get('reaction_summary', {}).get('love', 0) == 1):
                        self.log_test("Change reaction type", "PASS", "Reaction changed from like to love")
                    else:
                        self.log_test("Change reaction type", "FAIL", f"Reaction not properly changed: {data2}")
                else:
                    self.log_test("Change reaction type", "FAIL", f"Change status: {response2.status_code}")
            else:
                self.log_test("Change reaction type", "FAIL", f"Initial status: {response1.status_code}")
                
        except Exception as e:
            self.log_test("Change reaction type", "FAIL", str(e))
    
    def test_comment_reaction_notifications(self):
        """Test that reactions create notifications for comment author"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            comment_id = self.create_test_comment(post_id, "alice_comments", "Test comment for notifications! 🔔")
            if not comment_id:
                return
            
            alice_headers = self.get_auth_headers("alice_comments")
            bob_headers = self.get_auth_headers("bob_comments")
            
            # Get Alice's notifications before reaction
            before_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Bob reacts to Alice's comment
            reaction_response = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                            json={"reaction_type": "love"}, headers=bob_headers)
            
            if reaction_response.status_code == 200:
                # Wait for notification
                time.sleep(1)
                
                # Get Alice's notifications after reaction
                after_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    after_count = len(notifications)
                    
                    # Look for reaction notification
                    reaction_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'comment_like' and 
                            notif.get('actor_username') == 'bob_comments' and
                            'reacted ❤️' in notif.get('text', '')):
                            reaction_notification = notif
                            break
                    
                    if reaction_notification:
                        self.log_test("Reaction notifications", "PASS", 
                                    f"Notification created: {reaction_notification['text']}")
                    else:
                        self.log_test("Reaction notifications", "FAIL", 
                                    f"No reaction notification found. Before: {before_count}, After: {after_count}")
                else:
                    self.log_test("Reaction notifications", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Reaction notifications", "FAIL", 
                            f"Reaction failed: {reaction_response.status_code}")
                
        except Exception as e:
            self.log_test("Reaction notifications", "FAIL", str(e))
    
    def test_comment_reaction_delete_endpoint(self):
        """Test DELETE /api/comments/:commentId/react/:reactionType"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            comment_id = self.create_test_comment(post_id, "alice_comments", "Test comment for delete reaction! 🗑️")
            if not comment_id:
                return
            
            bob_headers = self.get_auth_headers("bob_comments")
            
            # Add reaction
            add_response = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                       json={"reaction_type": "wow"}, headers=bob_headers)
            
            if add_response.status_code == 200:
                # Remove reaction using DELETE endpoint
                delete_response = requests.delete(f"{self.base_url}/comments/{comment_id}/react/wow", 
                                                headers=bob_headers)
                
                if delete_response.status_code == 200:
                    data = delete_response.json()
                    if (data.get('user_reaction') is None and 
                        data.get('reaction_summary', {}).get('wow', 0) == 0):
                        self.log_test("Delete reaction endpoint", "PASS", "Reaction removed via DELETE endpoint")
                    else:
                        self.log_test("Delete reaction endpoint", "FAIL", f"Reaction not removed: {data}")
                else:
                    self.log_test("Delete reaction endpoint", "FAIL", f"Delete status: {delete_response.status_code}")
            else:
                self.log_test("Delete reaction endpoint", "FAIL", f"Add status: {add_response.status_code}")
                
        except Exception as e:
            self.log_test("Delete reaction endpoint", "FAIL", str(e))
    
    # ==================== FEATURE 2: COMMENT SORTING & FILTERING ====================
    
    def test_comment_sorting_newest(self):
        """Test GET /api/comments/:postId with sort=newest"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            # Create multiple comments with delays
            comment1_id = self.create_test_comment(post_id, "alice_comments", "First comment")
            time.sleep(1)
            comment2_id = self.create_test_comment(post_id, "bob_comments", "Second comment")
            time.sleep(1)
            comment3_id = self.create_test_comment(post_id, "charlie_comments", "Third comment")
            
            if not all([comment1_id, comment2_id, comment3_id]):
                return
            
            alice_headers = self.get_auth_headers("alice_comments")
            
            # Get comments sorted by newest
            response = requests.get(f"{self.base_url}/comments/{post_id}?sort=newest", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                comments = data.get('comments', [])
                
                if len(comments) >= 3:
                    # Check if sorted by newest (most recent first)
                    comment_ids = [c['id'] for c in comments]
                    if comment_ids[0] == comment3_id and comment_ids[1] == comment2_id and comment_ids[2] == comment1_id:
                        self.log_test("Comment sorting - newest", "PASS", "Comments sorted by newest correctly")
                    else:
                        self.log_test("Comment sorting - newest", "FAIL", f"Wrong order: {comment_ids}")
                else:
                    self.log_test("Comment sorting - newest", "FAIL", f"Expected 3 comments, got {len(comments)}")
            else:
                self.log_test("Comment sorting - newest", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Comment sorting - newest", "FAIL", str(e))
    
    def test_comment_sorting_most_liked(self):
        """Test GET /api/comments/:postId with sort=most_liked"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            # Create comments
            comment1_id = self.create_test_comment(post_id, "alice_comments", "Comment with 0 likes")
            comment2_id = self.create_test_comment(post_id, "bob_comments", "Comment with 2 likes")
            comment3_id = self.create_test_comment(post_id, "charlie_comments", "Comment with 1 like")
            
            if not all([comment1_id, comment2_id, comment3_id]):
                return
            
            # Add likes to create different like counts
            bob_headers = self.get_auth_headers("bob_comments")
            charlie_headers = self.get_auth_headers("charlie_comments")
            diana_headers = self.get_auth_headers("diana_comments")
            
            # comment2 gets 2 likes
            requests.post(f"{self.base_url}/comments/{comment2_id}/like", headers=charlie_headers)
            requests.post(f"{self.base_url}/comments/{comment2_id}/like", headers=diana_headers)
            
            # comment3 gets 1 like
            requests.post(f"{self.base_url}/comments/{comment3_id}/like", headers=diana_headers)
            
            alice_headers = self.get_auth_headers("alice_comments")
            
            # Get comments sorted by most liked
            response = requests.get(f"{self.base_url}/comments/{post_id}?sort=most_liked", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                comments = data.get('comments', [])
                
                if len(comments) >= 3:
                    # Check if sorted by like count (highest first)
                    like_counts = [c.get('like_count', 0) for c in comments]
                    if like_counts[0] >= like_counts[1] >= like_counts[2]:
                        self.log_test("Comment sorting - most liked", "PASS", 
                                    f"Comments sorted by likes: {like_counts}")
                    else:
                        self.log_test("Comment sorting - most liked", "FAIL", 
                                    f"Wrong like order: {like_counts}")
                else:
                    self.log_test("Comment sorting - most liked", "FAIL", f"Expected 3 comments, got {len(comments)}")
            else:
                self.log_test("Comment sorting - most liked", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Comment sorting - most liked", "FAIL", str(e))
    
    def test_comment_sorting_most_replied(self):
        """Test GET /api/comments/:postId with sort=most_replied"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            # Create parent comments
            comment1_id = self.create_test_comment(post_id, "alice_comments", "Comment with 0 replies")
            comment2_id = self.create_test_comment(post_id, "bob_comments", "Comment with 2 replies")
            comment3_id = self.create_test_comment(post_id, "charlie_comments", "Comment with 1 reply")
            
            if not all([comment1_id, comment2_id, comment3_id]):
                return
            
            # Add replies to create different reply counts
            charlie_headers = self.get_auth_headers("charlie_comments")
            diana_headers = self.get_auth_headers("diana_comments")
            
            # comment2 gets 2 replies
            requests.post(f"{self.base_url}/comments", json={
                "post_id": post_id,
                "text": "Reply 1 to comment2",
                "parent_comment_id": comment2_id
            }, headers=charlie_headers)
            
            requests.post(f"{self.base_url}/comments", json={
                "post_id": post_id,
                "text": "Reply 2 to comment2",
                "parent_comment_id": comment2_id
            }, headers=diana_headers)
            
            # comment3 gets 1 reply
            requests.post(f"{self.base_url}/comments", json={
                "post_id": post_id,
                "text": "Reply 1 to comment3",
                "parent_comment_id": comment3_id
            }, headers=diana_headers)
            
            alice_headers = self.get_auth_headers("alice_comments")
            
            # Get comments sorted by most replied
            response = requests.get(f"{self.base_url}/comments/{post_id}?sort=most_replied", headers=alice_headers)
            
            if response.status_code == 200:
                data = response.json()
                comments = data.get('comments', [])
                
                if len(comments) >= 3:
                    # Check if sorted by reply count (highest first)
                    reply_counts = [c.get('reply_count', 0) for c in comments]
                    if reply_counts[0] >= reply_counts[1] >= reply_counts[2]:
                        self.log_test("Comment sorting - most replied", "PASS", 
                                    f"Comments sorted by replies: {reply_counts}")
                    else:
                        self.log_test("Comment sorting - most replied", "FAIL", 
                                    f"Wrong reply order: {reply_counts}")
                else:
                    self.log_test("Comment sorting - most replied", "FAIL", f"Expected 3 comments, got {len(comments)}")
            else:
                self.log_test("Comment sorting - most replied", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Comment sorting - most replied", "FAIL", str(e))
    
    def test_reply_sorting(self):
        """Test GET /api/comments/:commentId/replies with sort parameter"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            parent_comment_id = self.create_test_comment(post_id, "alice_comments", "Parent comment for reply sorting")
            if not parent_comment_id:
                return
            
            # Create replies with delays
            bob_headers = self.get_auth_headers("bob_comments")
            charlie_headers = self.get_auth_headers("charlie_comments")
            diana_headers = self.get_auth_headers("diana_comments")
            
            reply1_response = requests.post(f"{self.base_url}/comments", json={
                "post_id": post_id,
                "text": "First reply",
                "parent_comment_id": parent_comment_id
            }, headers=bob_headers)
            
            time.sleep(1)
            
            reply2_response = requests.post(f"{self.base_url}/comments", json={
                "post_id": post_id,
                "text": "Second reply",
                "parent_comment_id": parent_comment_id
            }, headers=charlie_headers)
            
            if reply1_response.status_code == 201 and reply2_response.status_code == 201:
                reply1_id = reply1_response.json()['id']
                reply2_id = reply2_response.json()['id']
                
                # Test newest sort for replies
                alice_headers = self.get_auth_headers("alice_comments")
                response = requests.get(f"{self.base_url}/comments/{parent_comment_id}/replies?sort=newest", 
                                      headers=alice_headers)
                
                if response.status_code == 200:
                    data = response.json()
                    replies = data.get('replies', [])
                    
                    if len(replies) >= 2:
                        reply_ids = [r['id'] for r in replies]
                        if reply_ids[0] == reply2_id and reply_ids[1] == reply1_id:
                            self.log_test("Reply sorting - newest", "PASS", "Replies sorted by newest correctly")
                        else:
                            self.log_test("Reply sorting - newest", "FAIL", f"Wrong order: {reply_ids}")
                    else:
                        self.log_test("Reply sorting - newest", "FAIL", f"Expected 2 replies, got {len(replies)}")
                else:
                    self.log_test("Reply sorting - newest", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("Reply sorting - newest", "FAIL", "Failed to create replies")
                
        except Exception as e:
            self.log_test("Reply sorting - newest", "FAIL", str(e))
    
    # ==================== FEATURE 3: @MENTIONS IN COMMENTS ====================
    
    def test_comment_mentions_extraction(self):
        """Test @mentions extraction and storage in mentioned_user_ids"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            charlie_headers = self.get_auth_headers("charlie_comments")
            
            # Create comment with mentions
            comment_data = {
                "post_id": post_id,
                "text": "Hey @alice_comments and @bob_comments check this out! 👋"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=charlie_headers)
            
            if response.status_code == 201:
                comment = response.json()
                mentioned_user_ids = comment.get('mentioned_user_ids', [])
                
                alice_user_id = self.test_users["alice_comments"]["user_id"]
                bob_user_id = self.test_users["bob_comments"]["user_id"]
                
                if alice_user_id in mentioned_user_ids and bob_user_id in mentioned_user_ids:
                    self.log_test("Mention extraction", "PASS", 
                                f"Mentions extracted: {len(mentioned_user_ids)} users")
                else:
                    self.log_test("Mention extraction", "FAIL", 
                                f"Missing mentions. Expected: [{alice_user_id}, {bob_user_id}], Got: {mentioned_user_ids}")
            else:
                self.log_test("Mention extraction", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Mention extraction", "FAIL", str(e))
    
    def test_comment_mentions_notifications(self):
        """Test that @mentions create notifications for mentioned users"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            alice_headers = self.get_auth_headers("alice_comments")
            bob_headers = self.get_auth_headers("bob_comments")
            charlie_headers = self.get_auth_headers("charlie_comments")
            
            # Get Bob's notifications before mention
            before_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Charlie mentions Bob in a comment
            comment_data = {
                "post_id": post_id,
                "text": "Hey @bob_comments, what do you think about this? 🤔"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=charlie_headers)
            
            if response.status_code == 201:
                # Wait for notification
                time.sleep(1)
                
                # Get Bob's notifications after mention
                after_response = requests.get(f"{self.base_url}/notifications", headers=bob_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    after_count = len(notifications)
                    
                    # Look for mention notification
                    mention_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'comment' and 
                            notif.get('actor_username') == 'charlie_comments' and
                            'mentioned you in a comment' in notif.get('text', '')):
                            mention_notification = notif
                            break
                    
                    if mention_notification:
                        self.log_test("Mention notifications", "PASS", 
                                    f"Notification created: {mention_notification['text']}")
                    else:
                        self.log_test("Mention notifications", "FAIL", 
                                    f"No mention notification found. Before: {before_count}, After: {after_count}")
                else:
                    self.log_test("Mention notifications", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Mention notifications", "FAIL", 
                            f"Comment creation failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("Mention notifications", "FAIL", str(e))
    
    def test_comment_mentions_self_mention_prevention(self):
        """Test that self-mentions don't create notifications"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            alice_headers = self.get_auth_headers("alice_comments")
            
            # Get Alice's notifications before self-mention
            before_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
            before_count = len(before_response.json()) if before_response.status_code == 200 else 0
            
            # Alice mentions herself
            comment_data = {
                "post_id": post_id,
                "text": "I'm mentioning myself @alice_comments in this comment! 😄"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=alice_headers)
            
            if response.status_code == 201:
                # Wait a moment
                time.sleep(1)
                
                # Get Alice's notifications after self-mention
                after_response = requests.get(f"{self.base_url}/notifications", headers=alice_headers)
                
                if after_response.status_code == 200:
                    notifications = after_response.json()
                    after_count = len(notifications)
                    
                    # Look for self-mention notification (should not exist)
                    self_mention_notification = None
                    for notif in notifications:
                        if (notif.get('type') == 'comment' and 
                            notif.get('actor_username') == 'alice_comments' and
                            'mentioned you in a comment' in notif.get('text', '')):
                            self_mention_notification = notif
                            break
                    
                    if not self_mention_notification:
                        self.log_test("Self-mention prevention", "PASS", 
                                    "No notification created for self-mention")
                    else:
                        self.log_test("Self-mention prevention", "FAIL", 
                                    f"Self-mention notification created: {self_mention_notification}")
                else:
                    self.log_test("Self-mention prevention", "FAIL", 
                                f"Failed to get notifications: {after_response.status_code}")
            else:
                self.log_test("Self-mention prevention", "FAIL", 
                            f"Comment creation failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("Self-mention prevention", "FAIL", str(e))
    
    def test_comment_mentions_multiple_mentions(self):
        """Test multiple mentions in a single comment"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            diana_headers = self.get_auth_headers("diana_comments")
            
            # Create comment with multiple mentions
            comment_data = {
                "post_id": post_id,
                "text": "Hey @alice_comments, @bob_comments, and @charlie_comments! Let's discuss this together! 🗣️"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=diana_headers)
            
            if response.status_code == 201:
                comment = response.json()
                mentioned_user_ids = comment.get('mentioned_user_ids', [])
                
                alice_user_id = self.test_users["alice_comments"]["user_id"]
                bob_user_id = self.test_users["bob_comments"]["user_id"]
                charlie_user_id = self.test_users["charlie_comments"]["user_id"]
                
                expected_ids = {alice_user_id, bob_user_id, charlie_user_id}
                actual_ids = set(mentioned_user_ids)
                
                if expected_ids == actual_ids:
                    self.log_test("Multiple mentions", "PASS", 
                                f"All 3 mentions extracted correctly")
                else:
                    self.log_test("Multiple mentions", "FAIL", 
                                f"Expected: {expected_ids}, Got: {actual_ids}")
            else:
                self.log_test("Multiple mentions", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Multiple mentions", "FAIL", str(e))
    
    def test_comment_mentions_nonexistent_user(self):
        """Test mentions of non-existent users are ignored"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            alice_headers = self.get_auth_headers("alice_comments")
            
            # Create comment with valid and invalid mentions
            comment_data = {
                "post_id": post_id,
                "text": "Hey @bob_comments and @nonexistent_user, check this out! 👀"
            }
            
            response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=alice_headers)
            
            if response.status_code == 201:
                comment = response.json()
                mentioned_user_ids = comment.get('mentioned_user_ids', [])
                
                bob_user_id = self.test_users["bob_comments"]["user_id"]
                
                if len(mentioned_user_ids) == 1 and mentioned_user_ids[0] == bob_user_id:
                    self.log_test("Nonexistent user mentions", "PASS", 
                                "Only valid mentions stored, invalid ones ignored")
                else:
                    self.log_test("Nonexistent user mentions", "FAIL", 
                                f"Expected: [{bob_user_id}], Got: {mentioned_user_ids}")
            else:
                self.log_test("Nonexistent user mentions", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Nonexistent user mentions", "FAIL", str(e))
    
    # ==================== FEATURE 4: REAL-TIME WEBSOCKET EVENTS ====================
    
    def test_websocket_events_structure(self):
        """Test that WebSocket events are properly structured (basic validation)"""
        try:
            # This is a basic test since we can't easily test WebSocket events in this HTTP-based test suite
            # We'll verify that the endpoints that should emit WebSocket events are working
            
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            comment_id = self.create_test_comment(post_id, "alice_comments", "Test comment for WebSocket events")
            if not comment_id:
                return
            
            bob_headers = self.get_auth_headers("bob_comments")
            
            # Test that reaction endpoint works (should emit comment_reaction event)
            reaction_response = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                            json={"reaction_type": "like"}, headers=bob_headers)
            
            # Test that edit endpoint works (should emit edit_comment event)
            edit_response = requests.put(f"{self.base_url}/comments/{comment_id}", 
                                       json={"text": "Updated comment text for WebSocket test"}, 
                                       headers=self.get_auth_headers("alice_comments"))
            
            if reaction_response.status_code == 200 and edit_response.status_code == 200:
                self.log_test("WebSocket events structure", "PASS", 
                            "Endpoints that emit WebSocket events are functional")
            else:
                self.log_test("WebSocket events structure", "FAIL", 
                            f"Reaction: {reaction_response.status_code}, Edit: {edit_response.status_code}")
                
        except Exception as e:
            self.log_test("WebSocket events structure", "FAIL", str(e))
    
    # ==================== INTEGRATION TESTS ====================
    
    def test_complete_comments_workflow(self):
        """Test complete workflow: Create comment -> Add reactions -> Sort -> Mention users"""
        try:
            # Setup
            post_id = self.create_test_post("alice_comments")
            if not post_id:
                return
            
            # Step 1: Create comment with mention
            charlie_headers = self.get_auth_headers("charlie_comments")
            comment_data = {
                "post_id": post_id,
                "text": "Great post @alice_comments! I love this content 🔥"
            }
            
            comment_response = requests.post(f"{self.base_url}/comments", json=comment_data, headers=charlie_headers)
            
            if comment_response.status_code != 201:
                self.log_test("Complete workflow - Comment creation", "FAIL", f"Status: {comment_response.status_code}")
                return
            
            comment_id = comment_response.json()['id']
            
            # Step 2: Add reactions from different users
            bob_headers = self.get_auth_headers("bob_comments")
            diana_headers = self.get_auth_headers("diana_comments")
            
            reaction1 = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                    json={"reaction_type": "love"}, headers=bob_headers)
            reaction2 = requests.post(f"{self.base_url}/comments/{comment_id}/react", 
                                    json={"reaction_type": "wow"}, headers=diana_headers)
            
            if reaction1.status_code != 200 or reaction2.status_code != 200:
                self.log_test("Complete workflow - Reactions", "FAIL", 
                            f"Reaction1: {reaction1.status_code}, Reaction2: {reaction2.status_code}")
                return
            
            # Step 3: Verify comment appears in sorted list
            alice_headers = self.get_auth_headers("alice_comments")
            comments_response = requests.get(f"{self.base_url}/comments/{post_id}?sort=newest", headers=alice_headers)
            
            if comments_response.status_code == 200:
                data = comments_response.json()
                comments = data.get('comments', [])
                
                # Find our comment
                our_comment = None
                for c in comments:
                    if c['id'] == comment_id:
                        our_comment = c
                        break
                
                if our_comment:
                    # Verify reactions are present
                    reaction_summary = our_comment.get('reaction_summary', {})
                    mentioned_users = our_comment.get('mentioned_user_ids', [])
                    alice_user_id = self.test_users["alice_comments"]["user_id"]
                    
                    if (reaction_summary.get('love', 0) >= 1 and 
                        reaction_summary.get('wow', 0) >= 1 and
                        alice_user_id in mentioned_users):
                        self.log_test("Complete workflow", "PASS", 
                                    "Full workflow successful: Comment -> Reactions -> Mentions -> Sorting")
                    else:
                        self.log_test("Complete workflow", "FAIL", 
                                    f"Missing data: reactions={reaction_summary}, mentions={mentioned_users}")
                else:
                    self.log_test("Complete workflow", "FAIL", "Comment not found in sorted list")
            else:
                self.log_test("Complete workflow", "FAIL", f"Comments fetch status: {comments_response.status_code}")
                
        except Exception as e:
            self.log_test("Complete workflow", "FAIL", str(e))
    
    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all Track A Comments Upgrade Pack tests"""
        print("🚀 Starting SocialVibe Backend Testing Suite - Track A Comments Upgrade Pack")
        print("=" * 80)
        
        # Setup
        print("\n📋 Setting up test environment...")
        self.create_test_users()
        
        # Feature 1: Comment Emoji Reactions
        print("\n😊 Testing Comment Emoji Reactions...")
        self.test_comment_reaction_add_all_types()
        self.test_comment_reaction_toggle_behavior()
        self.test_comment_reaction_change_type()
        self.test_comment_reaction_notifications()
        self.test_comment_reaction_delete_endpoint()
        
        # Feature 2: Comment Sorting & Filtering
        print("\n📊 Testing Comment Sorting & Filtering...")
        self.test_comment_sorting_newest()
        self.test_comment_sorting_most_liked()
        self.test_comment_sorting_most_replied()
        self.test_reply_sorting()
        
        # Feature 3: @Mentions in Comments
        print("\n👥 Testing @Mentions in Comments...")
        self.test_comment_mentions_extraction()
        self.test_comment_mentions_notifications()
        self.test_comment_mentions_self_mention_prevention()
        self.test_comment_mentions_multiple_mentions()
        self.test_comment_mentions_nonexistent_user()
        
        # Feature 4: Real-time WebSocket Events
        print("\n🔄 Testing Real-time WebSocket Events...")
        self.test_websocket_events_structure()
        
        # Integration Tests
        print("\n🔗 Testing Integration Workflows...")
        self.test_complete_comments_workflow()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TRACK A COMMENTS UPGRADE PACK TESTING SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        total = len(self.test_results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/total)*100:.1f}%")
        
        # Categorize results by feature
        reaction_tests = [r for r in self.test_results if 'reaction' in r['test'].lower()]
        sorting_tests = [r for r in self.test_results if 'sorting' in r['test'].lower()]
        mention_tests = [r for r in self.test_results if 'mention' in r['test'].lower()]
        websocket_tests = [r for r in self.test_results if 'websocket' in r['test'].lower()]
        workflow_tests = [r for r in self.test_results if 'workflow' in r['test'].lower()]
        
        print(f"\n📊 BREAKDOWN BY FEATURE:")
        print(f"   😊 Emoji Reactions: {len([r for r in reaction_tests if r['status'] == 'PASS'])}/{len(reaction_tests)} passed")
        print(f"   📊 Sorting & Filtering: {len([r for r in sorting_tests if r['status'] == 'PASS'])}/{len(sorting_tests)} passed")
        print(f"   👥 @Mentions: {len([r for r in mention_tests if r['status'] == 'PASS'])}/{len(mention_tests)} passed")
        print(f"   🔄 WebSocket Events: {len([r for r in websocket_tests if r['status'] == 'PASS'])}/{len(websocket_tests)} passed")
        print(f"   🔗 Integration: {len([r for r in workflow_tests if r['status'] == 'PASS'])}/{len(workflow_tests)} passed")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = CommentsUpgradePackTester()
    results = tester.run_all_tests()
