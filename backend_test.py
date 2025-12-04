#!/usr/bin/env python3
"""
SocialVibe Backend Testing Suite - Phase 2 & 3 Features
Tests Video Upload, Stories with 24h Expiry, and Direct Messaging with WebSocket
"""

import requests
import json
import time
import os
import io
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://dark-premium-ui.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class SocialVibeBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.test_users = {}
        self.test_results = []
        
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
        """Create test users for testing"""
        users = [
            {"username": "videouser", "email": "video@test.com", "password": "password123"},
            {"username": "storyuser", "email": "story@test.com", "password": "password123"}
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
    
    # ==================== VIDEO UPLOAD AND POSTS TESTS ====================
    
    def test_video_upload_endpoint(self):
        """Test POST /api/posts/upload-video"""
        try:
            headers = self.get_auth_headers("videouser")
            
            # Test with sample video file
            video_file = self.create_sample_video_file()
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            
            # Remove Content-Type header for multipart upload
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            response = requests.post(f"{self.base_url}/posts/upload-video", 
                                   headers=upload_headers, files=files)
            
            if response.status_code == 200:
                data = response.json()
                if 'url' in data:
                    self.video_url = data['url']
                    self.log_test("Video upload endpoint", "PASS", f"Video uploaded: {data['url']}")
                else:
                    self.log_test("Video upload endpoint", "FAIL", "No URL in response")
            else:
                self.log_test("Video upload endpoint", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Video upload endpoint", "FAIL", str(e))
    
    def test_video_upload_size_limit(self):
        """Test video upload 50MB size limit"""
        try:
            headers = self.get_auth_headers("videouser")
            
            # Create a large file (simulate > 50MB)
            large_data = b'0' * (51 * 1024 * 1024)  # 51MB
            large_file = io.BytesIO(large_data)
            files = {'file': ('large_video.mp4', large_file, 'video/mp4')}
            
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            response = requests.post(f"{self.base_url}/posts/upload-video", 
                                   headers=upload_headers, files=files)
            
            if response.status_code == 400 and "too large" in response.text.lower():
                self.log_test("Video size limit enforcement", "PASS", "50MB limit properly enforced")
            else:
                self.log_test("Video size limit enforcement", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Video size limit enforcement", "FAIL", str(e))
    
    def test_video_format_validation(self):
        """Test video format validation"""
        try:
            headers = self.get_auth_headers("videouser")
            
            # Test with invalid format (text file)
            invalid_file = io.BytesIO(b'This is not a video file')
            files = {'file': ('test.txt', invalid_file, 'text/plain')}
            
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            response = requests.post(f"{self.base_url}/posts/upload-video", 
                                   headers=upload_headers, files=files)
            
            if response.status_code == 400 and "invalid" in response.text.lower():
                self.log_test("Video format validation", "PASS", "Invalid formats rejected")
            else:
                self.log_test("Video format validation", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Video format validation", "FAIL", str(e))
    
    def test_create_post_with_video(self):
        """Test creating post with video URL"""
        try:
            headers = self.get_auth_headers("videouser")
            
            # First upload a video to get URL
            video_file = self.create_sample_video_file()
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            upload_response = requests.post(f"{self.base_url}/posts/upload-video", 
                                          headers=upload_headers, files=files)
            
            if upload_response.status_code == 200:
                video_url = upload_response.json()['url']
                
                # Create post with video
                post_data = {
                    "text": "Check out this awesome video! #video #socialvibe",
                    "video_url": video_url
                }
                
                response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
                
                if response.status_code == 201:
                    post = response.json()
                    if post.get('video_url') == video_url:
                        self.video_post_id = post.get('id')
                        self.log_test("Create post with video", "PASS", f"Post created with video: {post['id']}")
                    else:
                        self.log_test("Create post with video", "FAIL", "Video URL not saved in post")
                else:
                    self.log_test("Create post with video", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("Create post with video", "FAIL", "Video upload failed")
        except Exception as e:
            self.log_test("Create post with video", "FAIL", str(e))
    
    def test_video_posts_in_feed(self):
        """Test that video posts appear in feed"""
        try:
            headers = self.get_auth_headers("videouser")
            
            response = requests.get(f"{self.base_url}/posts/feed", headers=headers)
            
            if response.status_code == 200:
                posts = response.json()
                video_posts = [p for p in posts if p.get('video_url')]
                
                if video_posts:
                    self.log_test("Video posts in feed", "PASS", f"Found {len(video_posts)} video posts in feed")
                else:
                    self.log_test("Video posts in feed", "FAIL", "No video posts found in feed")
            else:
                self.log_test("Video posts in feed", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Video posts in feed", "FAIL", str(e))
    
    # ==================== STORIES TESTS ====================
    
    def test_story_media_upload(self):
        """Test POST /api/stories/upload"""
        try:
            headers = self.get_auth_headers("storyuser")
            
            # Test image upload
            image_file = self.create_sample_image_file()
            files = {'file': ('test_image.png', image_file, 'image/png')}
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            response = requests.post(f"{self.base_url}/stories/upload", 
                                   headers=upload_headers, files=files)
            
            if response.status_code == 200:
                data = response.json()
                if 'url' in data and 'media_type' in data:
                    self.story_image_url = data['url']
                    self.log_test("Story media upload (image)", "PASS", f"Image uploaded: {data['url']}")
                else:
                    self.log_test("Story media upload (image)", "FAIL", "Missing URL or media_type in response")
            else:
                self.log_test("Story media upload (image)", "FAIL", f"Status: {response.status_code}")
            
            # Test video upload
            video_file = self.create_sample_video_file()
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            
            response = requests.post(f"{self.base_url}/stories/upload", 
                                   headers=upload_headers, files=files)
            
            if response.status_code == 200:
                data = response.json()
                if 'url' in data and data.get('media_type') == 'video':
                    self.story_video_url = data['url']
                    self.log_test("Story media upload (video)", "PASS", f"Video uploaded: {data['url']}")
                else:
                    self.log_test("Story media upload (video)", "FAIL", "Incorrect media_type or missing URL")
            else:
                self.log_test("Story media upload (video)", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Story media upload", "FAIL", str(e))
    
    def test_create_image_story(self):
        """Test creating image story"""
        try:
            headers = self.get_auth_headers("storyuser")
            
            # First upload image
            image_file = self.create_sample_image_file()
            files = {'file': ('story_image.png', image_file, 'image/png')}
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            upload_response = requests.post(f"{self.base_url}/stories/upload", 
                                          headers=upload_headers, files=files)
            
            if upload_response.status_code == 200:
                media_data = upload_response.json()
                
                # Create story
                story_data = {
                    "media_url": media_data['url'],
                    "media_type": "image"
                }
                
                response = requests.post(f"{self.base_url}/stories", json=story_data, headers=headers)
                
                if response.status_code == 201:
                    story = response.json()
                    if 'expires_at' in story:
                        self.image_story_id = story.get('id')
                        # Check if expires_at is approximately 24 hours from now
                        expires_at = datetime.fromisoformat(story['expires_at'].replace('Z', '+00:00'))
                        now = datetime.now()
                        time_diff = expires_at - now.replace(tzinfo=expires_at.tzinfo)
                        
                        if 23 <= time_diff.total_seconds() / 3600 <= 25:  # 23-25 hours (allowing some variance)
                            self.log_test("Create image story", "PASS", f"Story created with 24h expiry: {story['id']}")
                        else:
                            self.log_test("Create image story", "FAIL", f"Incorrect expiry time: {time_diff.total_seconds() / 3600} hours")
                    else:
                        self.log_test("Create image story", "FAIL", "No expires_at field in response")
                else:
                    self.log_test("Create image story", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("Create image story", "FAIL", "Image upload failed")
        except Exception as e:
            self.log_test("Create image story", "FAIL", str(e))
    
    def test_create_video_story(self):
        """Test creating video story"""
        try:
            headers = self.get_auth_headers("storyuser")
            
            # First upload video
            video_file = self.create_sample_video_file()
            files = {'file': ('story_video.mp4', video_file, 'video/mp4')}
            upload_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
            
            upload_response = requests.post(f"{self.base_url}/stories/upload", 
                                          headers=upload_headers, files=files)
            
            if upload_response.status_code == 200:
                media_data = upload_response.json()
                
                # Create story
                story_data = {
                    "media_url": media_data['url'],
                    "media_type": "video"
                }
                
                response = requests.post(f"{self.base_url}/stories", json=story_data, headers=headers)
                
                if response.status_code == 201:
                    story = response.json()
                    if story.get('media_type') == 'video' and 'expires_at' in story:
                        self.video_story_id = story.get('id')
                        self.log_test("Create video story", "PASS", f"Video story created: {story['id']}")
                    else:
                        self.log_test("Create video story", "FAIL", "Missing media_type or expires_at")
                else:
                    self.log_test("Create video story", "FAIL", f"Status: {response.status_code}")
            else:
                self.log_test("Create video story", "FAIL", "Video upload failed")
        except Exception as e:
            self.log_test("Create video story", "FAIL", str(e))
    
    def test_get_stories_with_view_status(self):
        """Test GET /api/stories with view status"""
        try:
            headers = self.get_auth_headers("storyuser")
            
            response = requests.get(f"{self.base_url}/stories", headers=headers)
            
            if response.status_code == 200:
                stories_data = response.json()
                
                if isinstance(stories_data, list) and len(stories_data) > 0:
                    # Check structure
                    story_group = stories_data[0]
                    required_fields = ['user_id', 'username', 'stories', 'has_viewed_all']
                    
                    if all(field in story_group for field in required_fields):
                        # Check individual story structure
                        if len(story_group['stories']) > 0:
                            story = story_group['stories'][0]
                            story_fields = ['id', 'media_url', 'media_type', 'has_viewed', 'expires_at']
                            
                            if all(field in story for field in story_fields):
                                self.log_test("Get stories with view status", "PASS", f"Found {len(stories_data)} story groups")
                            else:
                                self.log_test("Get stories with view status", "FAIL", "Missing story fields")
                        else:
                            self.log_test("Get stories with view status", "PASS", "Stories endpoint working (no stories)")
                    else:
                        self.log_test("Get stories with view status", "FAIL", "Missing required fields in story group")
                else:
                    self.log_test("Get stories with view status", "PASS", "Stories endpoint working (empty)")
            else:
                self.log_test("Get stories with view status", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get stories with view status", "FAIL", str(e))
    
    def test_view_story_tracking(self):
        """Test story view tracking"""
        try:
            headers = self.get_auth_headers("storyuser")
            
            # First create a story
            image_file = self.create_sample_image_file()
            files = {'file': ('view_test.png', image_file, 'image/png')}
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
                    
                    # Mark story as viewed
                    view_response = requests.post(f"{self.base_url}/stories/{story_id}/view", headers=headers)
                    
                    if view_response.status_code == 200:
                        self.log_test("Story view tracking", "PASS", f"Story {story_id} marked as viewed")
                    else:
                        self.log_test("Story view tracking", "FAIL", f"View status: {view_response.status_code}")
                else:
                    self.log_test("Story view tracking", "FAIL", "Story creation failed")
            else:
                self.log_test("Story view tracking", "FAIL", "Image upload failed")
        except Exception as e:
            self.log_test("Story view tracking", "FAIL", str(e))
    
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
            response = requests.get("https://dark-premium-ui.preview.emergentagent.com/socket.io/")
            
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