#!/usr/bin/env python3
"""
Test specific endpoints to isolate the issue
"""

import requests
import json

BACKEND_URL = "https://python-cleanup.preview.emergentagent.com/api"

def test_specific_endpoints():
    # Login to get token
    login_data = {
        "username": "debug_user",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} - {response.json()}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test auth/me (uses get_current_user)
    print("Testing /auth/me...")
    me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
    print(f"Auth/me: {me_response.status_code} - {me_response.json()}")
    
    # Test search (uses get_current_user_id)
    print("\nTesting /users/search...")
    search_response = requests.get(f"{BACKEND_URL}/users/search?q=debug", headers=headers)
    print(f"Search: {search_response.status_code} - {search_response.json()}")
    
    # Test suggested (uses get_current_user)
    print("\nTesting /users/suggested...")
    suggested_response = requests.get(f"{BACKEND_URL}/users/suggested", headers=headers)
    print(f"Suggested: {suggested_response.status_code} - {suggested_response.json()}")

if __name__ == "__main__":
    test_specific_endpoints()