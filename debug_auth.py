#!/usr/bin/env python3
"""
Debug authentication issues
"""

import requests
import json
from jose import jwt

BACKEND_URL = "https://feature-checks.preview.emergentagent.com/api"

def debug_auth():
    # First, create a user
    signup_data = {
        "username": "debug_user",
        "email": "debug@test.com",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/signup", json=signup_data)
    print(f"Signup response: {response.status_code}")
    print(f"Signup data: {response.json()}")
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"Token: {token}")
        
        # Decode token to see what's inside
        try:
            # Note: This will fail signature verification, but we can see the payload
            decoded = jwt.get_unverified_claims(token)
            print(f"Token payload: {decoded}")
        except Exception as e:
            print(f"Token decode error: {e}")
        
        # Test /auth/me endpoint
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        print(f"Auth/me response: {me_response.status_code}")
        print(f"Auth/me data: {me_response.json()}")
        
        # Test search endpoint
        search_response = requests.get(f"{BACKEND_URL}/users/search?q=debug", headers=headers)
        print(f"Search response: {search_response.status_code}")
        print(f"Search data: {search_response.json()}")

if __name__ == "__main__":
    debug_auth()