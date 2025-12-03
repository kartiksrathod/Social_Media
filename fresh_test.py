#!/usr/bin/env python3
"""
Test with a completely fresh user
"""

import requests
import json
import time

BACKEND_URL = "https://python-cleanup.preview.emergentagent.com/api"

def fresh_test():
    # Create a completely new user
    timestamp = int(time.time())
    signup_data = {
        "username": f"fresh_user_{timestamp}",
        "email": f"fresh_{timestamp}@test.com",
        "password": "testpass123"
    }
    
    print(f"Creating user: {signup_data['username']}")
    response = requests.post(f"{BACKEND_URL}/auth/signup", json=signup_data)
    print(f"Signup: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Signup failed: {response.json()}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Immediately test auth/me
    print("\nTesting auth/me immediately after signup...")
    me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
    print(f"Auth/me: {me_response.status_code}")
    if me_response.status_code == 200:
        user_data = me_response.json()
        print(f"User ID: {user_data['id']}")
        print(f"Username: {user_data['username']}")
    
    # Test search immediately
    print("\nTesting search immediately after signup...")
    search_response = requests.get(f"{BACKEND_URL}/users/search?q=fresh", headers=headers)
    print(f"Search: {search_response.status_code}")
    print(f"Search response: {search_response.json()}")
    
    # Test suggested immediately
    print("\nTesting suggested immediately after signup...")
    suggested_response = requests.get(f"{BACKEND_URL}/users/suggested", headers=headers)
    print(f"Suggested: {suggested_response.status_code}")
    print(f"Suggested response: {suggested_response.json()}")

if __name__ == "__main__":
    fresh_test()