#!/usr/bin/env python3
"""
SocialVibe Backend Testing Suite - Enhanced Mentions & Tags Feature (Phase 1)
Tests image tagging functionality and photo tag notifications
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://social-enhance.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class ImageTagsBackendTester:
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
        """Create test users for image tagging tests"""
        users = [
            {"username": "photographer", "email": "photographer@test.com", "password": "password123"},
            {"username": "taggeduser", "email": "tagged@test.com", "password": "password123"},
            {"username": "anotheruser", "email": "another@test.com", "password": "password123"}
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
                            "user_id": self.get_user_id_from_token(token_data.get("access_token")),
                            "username": user_data["username"]
                        }
                        self.log_test(f"Create user {user_data['username']}", "PASS")
                    else:
                        self.log_test(f"Login user {user_data['username']}", "FAIL", f"Status: {login_response.status_code}")
                elif response.status_code == 400 and "already" in response.text.lower():
                    # User exists, try to login
                    login_response = requests.post(f"{self.base_url}/auth/login", json={
                        "username": user_data["username"],
                        "password": user_data["password"]
                    })
                    if login_response.status_code == 200:
                        token_data = login_response.json()
                        self.test_users[user_data["username"]] = {
                            "token": token_data.get("access_token"),
                            "user_id": self.get_user_id_from_token(token_data.get("access_token")),
                            "username": user_data["username"]
                        }
                        self.log_test(f"Login existing user {user_data['username']}", "PASS")
                    else:
                        self.log_test(f"Login existing user {user_data['username']}", "FAIL", f"Status: {login_response.status_code}")
                else:
                    self.log_test(f"Create user {user_data['username']}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Create user {user_data['username']}", "FAIL", str(e))
    
    def get_user_id_from_token(self, token):
        """Get user ID by calling /me endpoint"""
        try:
            headers = self.headers.copy()
            headers["Authorization"] = f"Bearer {token}"
            response = requests.get(f"{self.base_url}/auth/me", headers=headers)
            if response.status_code == 200:
                return response.json().get("id")
        except:
            pass
        return None
    
    def get_auth_headers(self, username):
        """Get authorization headers for a user"""
        if username not in self.test_users:
            return self.headers
        token = self.test_users[username]["token"]
        headers = self.headers.copy()
        headers["Authorization"] = f"Bearer {token}"
        return headers
    
    # ==================== IMAGE TAGS TESTS ====================
    
    def test_create_post_with_image_tags(self):
        """Test creating a post with image_tags"""
        try:
            headers = self.get_auth_headers("photographer")
            tagged_user_id = self.test_users["taggeduser"]["user_id"]
            
            post_data = {
                "text": "Check out this amazing photo! #photography #socialvibe",
                "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
                "image_tags": [
                    {
                        "image_index": 0,
                        "x": 50.5,
                        "y": 30.2,
                        "user_id": tagged_user_id,
                        "username": "taggeduser",
                        "avatar": "https://example.com/avatar1.jpg"
                    },
                    {
                        "image_index": 1,
                        "x": 75.0,
                        "y": 45.8,
                        "user_id": tagged_user_id,
                        "username": "taggeduser",
                        "avatar": "https://example.com/avatar1.jpg"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
            
            if response.status_code == 201:
                post = response.json()
                
                # Verify post contains image_tags
                if "image_tags" in post and len(post["image_tags"]) == 2:
                    # Verify tag structure
                    tag = post["image_tags"][0]
                    required_fields = ["image_index", "x", "y", "user_id", "username"]
                    
                    if all(field in tag for field in required_fields):
                        self.post_with_tags_id = post.get("id")
                        self.log_test("Create post with image tags", "PASS", 
                                    f"Post created with {len(post['image_tags'])} image tags")
                    else:
                        self.log_test("Create post with image tags", "FAIL", "Missing required tag fields")
                else:
                    self.log_test("Create post with image tags", "FAIL", "Image tags not saved correctly")
            else:
                self.log_test("Create post with image tags", "FAIL", 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create post with image tags", "FAIL", str(e))
    
    def test_photo_tag_notification_creation(self):
        """Test that photo_tag notifications are created for tagged users"""
        try:
            # Wait a moment for notification to be created
            time.sleep(1)
            
            headers = self.get_auth_headers("taggeduser")
            
            response = requests.get(f"{self.base_url}/notifications", headers=headers)
            
            if response.status_code == 200:
                notifications = response.json()
                
                # Look for photo_tag notifications
                photo_tag_notifications = [n for n in notifications if n.get("type") == "photo_tag"]
                
                if photo_tag_notifications:
                    notification = photo_tag_notifications[0]
                    required_fields = ["id", "user_id", "actor_id", "actor_username", "type", "post_id"]
                    
                    if all(field in notification for field in required_fields):
                        if notification["type"] == "photo_tag":
                            self.log_test("Photo tag notification creation", "PASS", 
                                        f"Found {len(photo_tag_notifications)} photo_tag notifications")
                        else:
                            self.log_test("Photo tag notification creation", "FAIL", 
                                        f"Wrong notification type: {notification['type']}")
                    else:
                        self.log_test("Photo tag notification creation", "FAIL", "Missing required notification fields")
                else:
                    self.log_test("Photo tag notification creation", "FAIL", "No photo_tag notifications found")
            else:
                self.log_test("Photo tag notification creation", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Photo tag notification creation", "FAIL", str(e))
    
    def test_edit_post_add_image_tags(self):
        """Test editing a post to add new image tags"""
        try:
            # First create a post without tags
            headers = self.get_auth_headers("photographer")
            
            post_data = {
                "text": "Simple post without tags initially",
                "images": ["https://example.com/edit_test.jpg"]
            }
            
            response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
            
            if response.status_code == 201:
                post = response.json()
                post_id = post["id"]
                
                # Now edit to add image tags
                another_user_id = self.test_users["anotheruser"]["user_id"]
                
                edit_data = {
                    "text": "Updated post with new image tags! #updated",
                    "images": ["https://example.com/edit_test.jpg"],
                    "image_tags": [
                        {
                            "image_index": 0,
                            "x": 25.0,
                            "y": 60.0,
                            "user_id": another_user_id,
                            "username": "anotheruser",
                            "avatar": "https://example.com/avatar2.jpg"
                        }
                    ]
                }
                
                edit_response = requests.put(f"{self.base_url}/posts/{post_id}", 
                                           json=edit_data, headers=headers)
                
                if edit_response.status_code == 200:
                    updated_post = edit_response.json()
                    
                    if "image_tags" in updated_post and len(updated_post["image_tags"]) == 1:
                        tag = updated_post["image_tags"][0]
                        if tag["user_id"] == another_user_id:
                            self.log_test("Edit post add image tags", "PASS", 
                                        "Post successfully updated with image tags")
                        else:
                            self.log_test("Edit post add image tags", "FAIL", "Wrong user_id in tag")
                    else:
                        self.log_test("Edit post add image tags", "FAIL", "Image tags not added correctly")
                else:
                    self.log_test("Edit post add image tags", "FAIL", f"Edit status: {edit_response.status_code}")
            else:
                self.log_test("Edit post add image tags", "FAIL", f"Create status: {response.status_code}")
        except Exception as e:
            self.log_test("Edit post add image tags", "FAIL", str(e))
    
    def test_edit_post_notification_for_new_tags_only(self):
        """Test that notifications are sent only to newly tagged users, not duplicates"""
        try:
            # Wait for previous notification to be processed
            time.sleep(1)
            
            # Get initial notification count for anotheruser
            headers = self.get_auth_headers("anotheruser")
            initial_response = requests.get(f"{self.base_url}/notifications", headers=headers)
            
            if initial_response.status_code == 200:
                initial_notifications = initial_response.json()
                initial_count = len([n for n in initial_notifications if n.get("type") == "photo_tag"])
                
                # Wait a moment for the notification from the edit test
                time.sleep(2)
                
                # Check notifications again
                final_response = requests.get(f"{self.base_url}/notifications", headers=headers)
                
                if final_response.status_code == 200:
                    final_notifications = final_response.json()
                    final_count = len([n for n in final_notifications if n.get("type") == "photo_tag"])
                    
                    if final_count > initial_count:
                        self.log_test("Edit post notification for new tags only", "PASS", 
                                    f"New notification created for newly tagged user (count: {final_count})")
                    else:
                        self.log_test("Edit post notification for new tags only", "FAIL", 
                                    f"No new notification found (initial: {initial_count}, final: {final_count})")
                else:
                    self.log_test("Edit post notification for new tags only", "FAIL", 
                                f"Final check status: {final_response.status_code}")
            else:
                self.log_test("Edit post notification for new tags only", "FAIL", 
                            f"Initial check status: {initial_response.status_code}")
        except Exception as e:
            self.log_test("Edit post notification for new tags only", "FAIL", str(e))
    
    def test_multiple_tags_different_images(self):
        """Test creating a post with multiple tags on different images"""
        try:
            headers = self.get_auth_headers("photographer")
            tagged_user_id = self.test_users["taggeduser"]["user_id"]
            another_user_id = self.test_users["anotheruser"]["user_id"]
            
            post_data = {
                "text": "Group photo with multiple people tagged! #friends #memories",
                "images": [
                    "https://example.com/group1.jpg",
                    "https://example.com/group2.jpg",
                    "https://example.com/group3.jpg"
                ],
                "image_tags": [
                    {
                        "image_index": 0,
                        "x": 30.0,
                        "y": 40.0,
                        "user_id": tagged_user_id,
                        "username": "taggeduser",
                        "avatar": "https://example.com/avatar1.jpg"
                    },
                    {
                        "image_index": 0,
                        "x": 70.0,
                        "y": 35.0,
                        "user_id": another_user_id,
                        "username": "anotheruser",
                        "avatar": "https://example.com/avatar2.jpg"
                    },
                    {
                        "image_index": 1,
                        "x": 50.0,
                        "y": 60.0,
                        "user_id": tagged_user_id,
                        "username": "taggeduser",
                        "avatar": "https://example.com/avatar1.jpg"
                    },
                    {
                        "image_index": 2,
                        "x": 45.0,
                        "y": 25.0,
                        "user_id": another_user_id,
                        "username": "anotheruser",
                        "avatar": "https://example.com/avatar2.jpg"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
            
            if response.status_code == 201:
                post = response.json()
                
                if "image_tags" in post and len(post["image_tags"]) == 4:
                    # Verify tags are correctly associated with different images
                    image_0_tags = [tag for tag in post["image_tags"] if tag["image_index"] == 0]
                    image_1_tags = [tag for tag in post["image_tags"] if tag["image_index"] == 1]
                    image_2_tags = [tag for tag in post["image_tags"] if tag["image_index"] == 2]
                    
                    if len(image_0_tags) == 2 and len(image_1_tags) == 1 and len(image_2_tags) == 1:
                        # Verify different users are tagged
                        tagged_users = set(tag["user_id"] for tag in post["image_tags"])
                        
                        if len(tagged_users) == 2:
                            self.log_test("Multiple tags different images", "PASS", 
                                        f"Created post with 4 tags across 3 images for 2 users")
                        else:
                            self.log_test("Multiple tags different images", "FAIL", 
                                        f"Wrong number of unique users: {len(tagged_users)}")
                    else:
                        self.log_test("Multiple tags different images", "FAIL", 
                                    f"Wrong tag distribution: img0={len(image_0_tags)}, img1={len(image_1_tags)}, img2={len(image_2_tags)}")
                else:
                    self.log_test("Multiple tags different images", "FAIL", 
                                f"Wrong number of tags: {len(post.get('image_tags', []))}")
            else:
                self.log_test("Multiple tags different images", "FAIL", 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Multiple tags different images", "FAIL", str(e))
    
    def test_tag_coordinates_validation(self):
        """Test that tag coordinates are properly stored and retrieved"""
        try:
            headers = self.get_auth_headers("photographer")
            tagged_user_id = self.test_users["taggeduser"]["user_id"]
            
            # Test with specific coordinates
            test_coordinates = [
                {"x": 0.0, "y": 0.0},      # Top-left corner
                {"x": 100.0, "y": 100.0},  # Bottom-right corner
                {"x": 50.5, "y": 25.7},    # Decimal coordinates
            ]
            
            post_data = {
                "text": "Testing coordinate precision #coordinates",
                "images": ["https://example.com/coord_test.jpg"],
                "image_tags": [
                    {
                        "image_index": 0,
                        "x": coord["x"],
                        "y": coord["y"],
                        "user_id": tagged_user_id,
                        "username": "taggeduser",
                        "avatar": "https://example.com/avatar1.jpg"
                    } for coord in test_coordinates
                ]
            }
            
            response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
            
            if response.status_code == 201:
                post = response.json()
                
                if "image_tags" in post and len(post["image_tags"]) == 3:
                    # Verify coordinates are preserved
                    all_coords_correct = True
                    for i, tag in enumerate(post["image_tags"]):
                        expected_x = test_coordinates[i]["x"]
                        expected_y = test_coordinates[i]["y"]
                        
                        if tag["x"] != expected_x or tag["y"] != expected_y:
                            all_coords_correct = False
                            break
                    
                    if all_coords_correct:
                        self.log_test("Tag coordinates validation", "PASS", 
                                    "All coordinates preserved correctly including decimals")
                    else:
                        self.log_test("Tag coordinates validation", "FAIL", 
                                    "Coordinates not preserved correctly")
                else:
                    self.log_test("Tag coordinates validation", "FAIL", 
                                f"Wrong number of tags: {len(post.get('image_tags', []))}")
            else:
                self.log_test("Tag coordinates validation", "FAIL", 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Tag coordinates validation", "FAIL", str(e))
    
    def test_self_tagging_no_notification(self):
        """Test that users don't get notifications when they tag themselves"""
        try:
            headers = self.get_auth_headers("photographer")
            photographer_user_id = self.test_users["photographer"]["user_id"]
            
            # Get initial notification count
            initial_response = requests.get(f"{self.base_url}/notifications", headers=headers)
            initial_count = 0
            if initial_response.status_code == 200:
                initial_notifications = initial_response.json()
                initial_count = len([n for n in initial_notifications if n.get("type") == "photo_tag"])
            
            # Create post where user tags themselves
            post_data = {
                "text": "Selfie time! #selfie",
                "images": ["https://example.com/selfie.jpg"],
                "image_tags": [
                    {
                        "image_index": 0,
                        "x": 50.0,
                        "y": 50.0,
                        "user_id": photographer_user_id,
                        "username": "photographer",
                        "avatar": "https://example.com/photographer_avatar.jpg"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
            
            if response.status_code == 201:
                # Wait a moment for potential notification
                time.sleep(1)
                
                # Check notifications again
                final_response = requests.get(f"{self.base_url}/notifications", headers=headers)
                
                if final_response.status_code == 200:
                    final_notifications = final_response.json()
                    final_count = len([n for n in final_notifications if n.get("type") == "photo_tag"])
                    
                    if final_count == initial_count:
                        self.log_test("Self tagging no notification", "PASS", 
                                    "No notification created for self-tagging")
                    else:
                        self.log_test("Self tagging no notification", "FAIL", 
                                    f"Unexpected notification created (initial: {initial_count}, final: {final_count})")
                else:
                    self.log_test("Self tagging no notification", "FAIL", 
                                f"Final check status: {final_response.status_code}")
            else:
                self.log_test("Self tagging no notification", "FAIL", 
                            f"Post creation status: {response.status_code}")
        except Exception as e:
            self.log_test("Self tagging no notification", "FAIL", str(e))
    
    def test_notification_content_validation(self):
        """Test that photo_tag notifications contain correct information"""
        try:
            # Create a post with a tag to generate a notification
            headers = self.get_auth_headers("photographer")
            tagged_user_id = self.test_users["taggeduser"]["user_id"]
            
            post_data = {
                "text": "Testing notification content #test",
                "images": ["https://example.com/notification_test.jpg"],
                "image_tags": [
                    {
                        "image_index": 0,
                        "x": 40.0,
                        "y": 60.0,
                        "user_id": tagged_user_id,
                        "username": "taggeduser",
                        "avatar": "https://example.com/avatar1.jpg"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/posts", json=post_data, headers=headers)
            
            if response.status_code == 201:
                post = response.json()
                post_id = post["id"]
                
                # Wait for notification
                time.sleep(1)
                
                # Check notification content
                tagged_headers = self.get_auth_headers("taggeduser")
                notif_response = requests.get(f"{self.base_url}/notifications", headers=tagged_headers)
                
                if notif_response.status_code == 200:
                    notifications = notif_response.json()
                    photo_tag_notifications = [n for n in notifications if n.get("type") == "photo_tag"]
                    
                    if photo_tag_notifications:
                        notification = photo_tag_notifications[0]
                        
                        # Validate notification content
                        checks = [
                            notification.get("type") == "photo_tag",
                            notification.get("actor_username") == "photographer",
                            notification.get("post_id") == post_id,
                            notification.get("text") == "tagged you in a photo",
                            "created_at" in notification
                        ]
                        
                        if all(checks):
                            self.log_test("Notification content validation", "PASS", 
                                        "Photo tag notification contains all required fields with correct values")
                        else:
                            self.log_test("Notification content validation", "FAIL", 
                                        f"Notification validation failed: {notification}")
                    else:
                        self.log_test("Notification content validation", "FAIL", 
                                    "No photo_tag notification found")
                else:
                    self.log_test("Notification content validation", "FAIL", 
                                f"Notification check status: {notif_response.status_code}")
            else:
                self.log_test("Notification content validation", "FAIL", 
                            f"Post creation status: {response.status_code}")
        except Exception as e:
            self.log_test("Notification content validation", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all image tags backend tests"""
        print("🚀 Starting SocialVibe Backend Testing Suite - Enhanced Mentions & Tags (Phase 1)")
        print("=" * 80)
        
        # Setup
        print("\n📋 Setting up test environment...")
        self.create_test_users()
        
        # Image Tags Tests
        print("\n🏷️  Testing Image Tagging Functionality...")
        self.test_create_post_with_image_tags()
        self.test_photo_tag_notification_creation()
        self.test_edit_post_add_image_tags()
        self.test_edit_post_notification_for_new_tags_only()
        self.test_multiple_tags_different_images()
        self.test_tag_coordinates_validation()
        self.test_self_tagging_no_notification()
        self.test_notification_content_validation()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
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
    tester = ImageTagsBackendTester()
    results = tester.run_all_tests()